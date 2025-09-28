import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireAdmin, requireOwnershipOrRole } from '../middleware/auth';
import { validate } from '../utils/validation';
import { userSchemas, paginationSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';
import { UserRole } from '../types';

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, validate(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const usersResult = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, bio, language_preference, 
              is_active, email_verified, last_login, created_at, updated_at
       FROM users 
       ORDER BY ${sort} ${order}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: usersResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const userResult = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, bio, language_preference, 
              is_active, email_verified, last_login, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      throw new CustomError('User not found', 404);
    }

    const user = userResult.rows[0];

    // Check if user can access this profile
    if (req.user?.user_id !== id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', authenticateToken, validate(userSchemas.update), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user can update this profile
    if (req.user?.user_id !== id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const updateFields = Object.keys(updates);
    const updateValues = Object.values(updates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, email, first_name, last_name, role, avatar_url, bio, language_preference, 
                 is_active, email_verified, last_login, created_at, updated_at`,
      [id, ...updateValues]
    );

    if (result.rows.length === 0) {
      throw new CustomError('User not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user?.user_id === id) {
      throw new CustomError('Cannot delete your own account', 400);
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new CustomError('User not found', 404);
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Activate/Deactivate user (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      throw new CustomError('is_active must be a boolean', 400);
    }

    // Prevent admin from deactivating themselves
    if (req.user?.user_id === id && !is_active) {
      throw new CustomError('Cannot deactivate your own account', 400);
    }

    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_active',
      [is_active, id]
    );

    if (result.rows.length === 0) {
      throw new CustomError('User not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/:id/stats', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user can access this data
    if (req.user?.user_id !== id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const statsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM content WHERE author_id = $1) as total_content,
        (SELECT COUNT(*) FROM content WHERE author_id = $1 AND status = 'published') as published_content,
        (SELECT COUNT(*) FROM content WHERE author_id = $1 AND status = 'draft') as draft_content,
        (SELECT COUNT(*) FROM reviews WHERE reviewer_id = $1) as total_reviews,
        (SELECT COUNT(*) FROM comments WHERE author_id = $1) as total_comments`,
      [id]
    );

    res.json({ success: true, data: statsResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;


