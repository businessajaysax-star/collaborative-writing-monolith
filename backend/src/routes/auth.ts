import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database';
import { cache } from '../config/redis';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { userSchemas } from '../utils/validation';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';
import { AuthResponse, CreateUserRequest, LoginRequest, JWTPayload, UserRole } from '../types';

const router = Router();

// Register user
router.post('/register', validate(userSchemas.register), async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role, language_preference }: CreateUserRequest = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new CustomError('User with this email already exists', 409);
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, language_preference)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, language_preference, created_at`,
      [email, password_hash, first_name, last_name, role || 'student', language_preference || 'english']
    );

    const user = result.rows[0];

    // Generate tokens
    const tokens = await generateTokens(user.id, user.email, user.role);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        language_preference: user.language_preference,
        created_at: user.created_at
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    };

    logger.info('User registered successfully', { userId: user.id, email: user.email });
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validate(userSchemas.login), async (req, res, next) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user
    const userResult = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, language_preference, is_active FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new CustomError('Invalid email or password', 401);
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      throw new CustomError('Account is deactivated', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate tokens
    const tokens = await generateTokens(user.id, user.email, user.role);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        language_preference: user.language_preference
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    };

    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new CustomError('Refresh token required', 400);
    }

    // Verify refresh token
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    const decoded = jwt.verify(refresh_token, secret) as JWTPayload;

    // Check if refresh token exists in database
    const tokenResult = await query(
      'SELECT id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() AND is_revoked = false',
      [refresh_token]
    );

    if (tokenResult.rows.length === 0) {
      throw new CustomError('Invalid refresh token', 401);
    }

    // Get user details
    const userResult = await query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.user_id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw new CustomError('User not found or inactive', 401);
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const tokens = await generateTokens(user.id, user.email, user.role);

    // Revoke old refresh token
    await query('UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1', [refresh_token]);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const userId = req.user?.user_id;

    if (refresh_token) {
      // Revoke refresh token
      await query('UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1', [refresh_token]);
    }

    // Add access token to blacklist (if provided in header)
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];
    if (accessToken) {
      await cache.set(`blacklist:${accessToken}`, 'true', 900); // 15 minutes
    }

    logger.info('User logged out successfully', { userId });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.user_id;

    const userResult = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, bio, language_preference, 
              is_active, email_verified, last_login, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new CustomError('User not found', 404);
    }

    const user = userResult.rows[0];
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate tokens
async function generateTokens(userId: string, email: string, role: UserRole): Promise<{ access_token: string; refresh_token: string }> {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { user_id: userId, email, role },
    accessSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { user_id: userId, email, role },
    refreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, refreshToken, expiresAt]
  );

  return { access_token: accessToken, refresh_token: refreshToken };
}

export default router;


