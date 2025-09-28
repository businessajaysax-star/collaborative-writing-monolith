import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireReviewer } from '../middleware/auth';
import { validate } from '../utils/validation';
import { reviewSchemas, paginationSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';
import { UserRole, ReviewStatus } from '../types';

const router = Router();

// Get all reviews
router.get('/', authenticateToken, validate(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params: any[] = [limit, offset];

    // Filter by reviewer if not admin
    if (req.user?.role !== UserRole.ADMIN) {
      whereClause = 'WHERE r.reviewer_id = $3';
      params.push(req.user.user_id);
    }

    const reviewsResult = await query(
      `SELECT r.*, c.title as content_title, c.content as content_preview,
              u1.first_name as reviewer_first_name, u1.last_name as reviewer_last_name,
              u2.first_name as author_first_name, u2.last_name as author_last_name
       FROM reviews r
       LEFT JOIN content c ON r.content_id = c.id
       LEFT JOIN users u1 ON r.reviewer_id = u1.id
       LEFT JOIN users u2 ON c.author_id = u2.id
       ${whereClause}
       ORDER BY r.${sort} ${order}
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM reviews r ${whereClause}`,
      params.slice(2)
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: reviewsResult.rows,
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

// Get review by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const reviewResult = await query(
      `SELECT r.*, c.title as content_title, c.content as content_preview,
              u1.first_name as reviewer_first_name, u1.last_name as reviewer_last_name,
              u2.first_name as author_first_name, u2.last_name as author_last_name
       FROM reviews r
       LEFT JOIN content c ON r.content_id = c.id
       LEFT JOIN users u1 ON r.reviewer_id = u1.id
       LEFT JOIN users u2 ON c.author_id = u2.id
       WHERE r.id = $1`,
      [id]
    );

    if (reviewResult.rows.length === 0) {
      throw new CustomError('Review not found', 404);
    }

    const review = reviewResult.rows[0];

    // Check access permissions
    if (review.reviewer_id !== req.user?.user_id && 
        review.author_id !== req.user?.user_id && 
        req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// Create review
router.post('/', authenticateToken, requireReviewer, validate(reviewSchemas.create), async (req, res, next) => {
  try {
    const { content_id, reviewer_id } = req.body;

    // Check if content exists
    const contentResult = await query('SELECT id, author_id, status FROM content WHERE id = $1', [content_id]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];

    // Check if content is submitted for review
    if (content.status !== 'submitted') {
      throw new CustomError('Content is not submitted for review', 400);
    }

    // Check if review already exists
    const existingReview = await query(
      'SELECT id FROM reviews WHERE content_id = $1 AND reviewer_id = $2',
      [content_id, reviewer_id]
    );

    if (existingReview.rows.length > 0) {
      throw new CustomError('Review already exists for this content', 409);
    }

    const result = await query(
      `INSERT INTO reviews (content_id, reviewer_id, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [content_id, reviewer_id, ReviewStatus.PENDING]
    );

    // Update content status to under review
    await query(
      'UPDATE content SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['under_review', content_id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update review
router.put('/:id', authenticateToken, validate(reviewSchemas.update), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user can update this review
    const reviewResult = await query('SELECT reviewer_id, status FROM reviews WHERE id = $1', [id]);
    if (reviewResult.rows.length === 0) {
      throw new CustomError('Review not found', 404);
    }

    const review = reviewResult.rows[0];
    if (review.reviewer_id !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    // Don't allow updates to completed reviews unless admin
    if (review.status === ReviewStatus.COMPLETED && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Cannot update completed review', 400);
    }

    const updateFields = Object.keys(updates);
    const updateValues = Object.values(updates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    // If completing the review, set completed_at
    if (updates.status === ReviewStatus.COMPLETED) {
      setClause += ', completed_at = CURRENT_TIMESTAMP';
    }

    const result = await query(
      `UPDATE reviews SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id, ...updateValues]
    );

    // If review is completed, check if all reviews are done and update content status
    if (updates.status === ReviewStatus.COMPLETED) {
      const pendingReviews = await query(
        'SELECT COUNT(*) FROM reviews WHERE content_id = $1 AND status != $2',
        [result.rows[0].content_id, ReviewStatus.COMPLETED]
      );

      if (parseInt(pendingReviews.rows[0].count) === 0) {
        // All reviews completed, update content status based on average rating
        const avgRatingResult = await query(
          'SELECT AVG(rating) as avg_rating FROM reviews WHERE content_id = $1 AND rating IS NOT NULL',
          [result.rows[0].content_id]
        );

        const avgRating = parseFloat(avgRatingResult.rows[0].avg_rating) || 0;
        const newStatus = avgRating >= 3 ? 'approved' : 'rejected';

        await query(
          'UPDATE content SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStatus, result.rows[0].content_id]
        );
      }
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user can delete this review
    const reviewResult = await query('SELECT reviewer_id FROM reviews WHERE id = $1', [id]);
    if (reviewResult.rows.length === 0) {
      throw new CustomError('Review not found', 404);
    }

    const review = reviewResult.rows[0];
    if (review.reviewer_id !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING id', [id]);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get reviews for content
router.get('/content/:contentId', authenticateToken, async (req, res, next) => {
  try {
    const { contentId } = req.params;

    // Check if user can access this content's reviews
    const contentResult = await query('SELECT author_id FROM content WHERE id = $1', [contentId]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];
    if (content.author_id !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const reviewsResult = await query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       WHERE r.content_id = $1
       ORDER BY r.created_at DESC`,
      [contentId]
    );

    res.json({ success: true, data: reviewsResult.rows });
  } catch (error) {
    next(error);
  }
});

// Get reviewer statistics
router.get('/stats/reviewer/:reviewerId', authenticateToken, async (req, res, next) => {
  try {
    const { reviewerId } = req.params;

    // Check if user can access this data
    if (req.user?.user_id !== reviewerId && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reviews,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_reviews,
        AVG(rating) as average_rating,
        AVG(grammar_score) as average_grammar_score,
        AVG(creativity_score) as average_creativity_score,
        AVG(relevance_score) as average_relevance_score
       FROM reviews 
       WHERE reviewer_id = $1`,
      [reviewerId]
    );

    res.json({ success: true, data: statsResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;


