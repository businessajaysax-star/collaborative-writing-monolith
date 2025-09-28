import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { cache } from '../config/redis';
import { JWTPayload, UserRole } from '../types';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ success: false, message: 'Access token required' });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ success: false, message: 'Token has been revoked' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Verify user still exists and is active
    const userResult = await query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.user_id]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      res.status(401).json({ success: false, message: 'User account is deactivated' });
      return;
    }

    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      organization_id: decoded.organization_id
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }
    
    logger.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireTeacher = requireRole([UserRole.ADMIN, UserRole.TEACHER]);
export const requireReviewer = requireRole([UserRole.ADMIN, UserRole.TEACHER, UserRole.REVIEWER]);

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Verify user still exists and is active
    const userResult = await query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.user_id]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
      req.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        organization_id: decoded.organization_id
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    next();
  }
};

export const requireOwnershipOrRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Check if user has required role
    if (roles.includes(req.user.role)) {
      next();
      return;
    }

    // Check if user is the owner of the resource
    const resourceUserId = req.params.userId || req.body.user_id;
    if (resourceUserId && resourceUserId === req.user.user_id) {
      next();
      return;
    }

    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access your own resources or have required role.' 
    });
  };
};


