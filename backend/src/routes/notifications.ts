import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { paginationSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';
import { UserRole, NotificationType } from '../types';

const router = Router();

// Get user notifications
router.get('/', authenticateToken, validate(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const userId = req.user?.user_id;

    const notificationsResult = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: notificationsResult.rows,
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

// Get unread notifications count
router.get('/unread-count', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.user_id;

    const countResult = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ 
      success: true, 
      data: { 
        unread_count: parseInt(countResult.rows[0].count) 
      } 
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;

    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('Notification not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user?.user_id;

    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('Notification not found', 404);
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Create notification (admin only)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { user_id, type, title, message, data } = req.body;

    // Only admins can create notifications for other users
    if (user_id !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, type, title, message, data ? JSON.stringify(data) : null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get notification by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;

    const notificationResult = await query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (notificationResult.rows.length === 0) {
      throw new CustomError('Notification not found', 404);
    }

    res.json({ success: true, data: notificationResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Helper function to create notification (used by other services)
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
): Promise<void> => {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to create bulk notifications
export const createBulkNotifications = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data?: any
): Promise<void> => {
  try {
    const values = userIds.map((userId, index) => 
      `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`
    ).join(', ');

    const params = userIds.flatMap(userId => [
      userId, type, title, message, data ? JSON.stringify(data) : null
    ]);

    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ${values}`,
      params
    );
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
};

export default router;


