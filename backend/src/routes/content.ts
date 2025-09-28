import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireOwnershipOrRole } from '../middleware/auth';
import { validate } from '../utils/validation';
import { contentSchemas, paginationSchema, searchSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';
import { UserRole, ContentStatus } from '../types';
import { calculateReadingTime, generateExcerpt, detectLanguage } from '../utils/validation';

const router = Router();

// Get all content
router.get('/', authenticateToken, validate(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params: any[] = [limit, offset];

    // Filter by user's content or organization content
    if (req.user?.role === UserRole.STUDENT) {
      whereClause = 'WHERE c.author_id = $3';
      params.push(req.user.user_id);
    } else if (req.user?.role === UserRole.TEACHER) {
      // Teachers can see content from their organization
      whereClause = 'WHERE c.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = $3)';
      params.push(req.user.user_id);
    }

    const contentResult = await query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url as author_avatar,
              o.name as organization_name
       FROM content c
       LEFT JOIN users u ON c.author_id = u.id
       LEFT JOIN organizations o ON c.organization_id = o.id
       ${whereClause}
       ORDER BY c.${sort} ${order}
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM content c ${whereClause}`,
      params.slice(2)
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: contentResult.rows,
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

// Get content by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const contentResult = await query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url as author_avatar,
              o.name as organization_name
       FROM content c
       LEFT JOIN users u ON c.author_id = u.id
       LEFT JOIN organizations o ON c.organization_id = o.id
       WHERE c.id = $1`,
      [id]
    );

    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];

    // Check access permissions
    if (content.author_id !== req.user?.user_id && 
        req.user?.role !== UserRole.ADMIN && 
        req.user?.role !== UserRole.TEACHER) {
      throw new CustomError('Access denied', 403);
    }

    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

// Create content
router.post('/', authenticateToken, validate(contentSchemas.create), async (req, res, next) => {
  try {
    const { title, content, language, organization_id, category, tags, featured_image_url } = req.body;
    const author_id = req.user?.user_id;

    // Calculate word count and reading time
    const wordCount = content.split(/\s+/).length;
    const readingTime = calculateReadingTime(content);
    const excerpt = generateExcerpt(content);

    const result = await query(
      `INSERT INTO content (title, content, excerpt, language, author_id, organization_id, 
                          category, tags, word_count, reading_time, featured_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [title, content, excerpt, language, author_id, organization_id, category, tags, wordCount, readingTime, featured_image_url]
    );

    const newContent = result.rows[0];

    // Create initial version
    await query(
      `INSERT INTO content_versions (content_id, version_number, title, content, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [newContent.id, 1, title, content, author_id]
    );

    res.status(201).json({ success: true, data: newContent });
  } catch (error) {
    next(error);
  }
});

// Update content
router.put('/:id', authenticateToken, validate(contentSchemas.update), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user can update this content
    const contentResult = await query('SELECT author_id, status FROM content WHERE id = $1', [id]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];
    if (content.author_id !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    // Don't allow updates to published content unless admin
    if (content.status === ContentStatus.PUBLISHED && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Cannot update published content', 400);
    }

    const updateFields = Object.keys(updates);
    const updateValues = Object.values(updates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    // Recalculate word count and reading time if content is being updated
    if (updates.content) {
      const wordCount = updates.content.split(/\s+/).length;
      const readingTime = calculateReadingTime(updates.content);
      const excerpt = generateExcerpt(updates.content);
      
      setClause += ', word_count = $' + (updateFields.length + 2) + 
                   ', reading_time = $' + (updateFields.length + 3) + 
                   ', excerpt = $' + (updateFields.length + 4);
      updateValues.push(wordCount, readingTime, excerpt);
    }

    const result = await query(
      `UPDATE content SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id, ...updateValues]
    );

    // Create new version if content was updated
    if (updates.content) {
      const versionResult = await query(
        'SELECT MAX(version_number) as max_version FROM content_versions WHERE content_id = $1',
        [id]
      );
      const nextVersion = (versionResult.rows[0].max_version || 0) + 1;

      await query(
        `INSERT INTO content_versions (content_id, version_number, title, content, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, nextVersion, updates.title || result.rows[0].title, updates.content, req.user?.user_id]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete content
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user can delete this content
    const contentResult = await query('SELECT author_id FROM content WHERE id = $1', [id]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];
    if (content.author_id !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const result = await query('DELETE FROM content WHERE id = $1 RETURNING id', [id]);

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Submit content for review
router.post('/:id/submit', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user can submit this content
    const contentResult = await query('SELECT author_id, status FROM content WHERE id = $1', [id]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];
    if (content.author_id !== req.user?.user_id) {
      throw new CustomError('Access denied', 403);
    }

    if (content.status !== ContentStatus.DRAFT) {
      throw new CustomError('Content is not in draft status', 400);
    }

    const result = await query(
      'UPDATE content SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [ContentStatus.SUBMITTED, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get content versions
router.get('/:id/versions', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check access permissions
    const contentResult = await query('SELECT author_id FROM content WHERE id = $1', [id]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];
    if (content.author_id !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const versionsResult = await query(
      `SELECT cv.*, u.first_name, u.last_name
       FROM content_versions cv
       LEFT JOIN users u ON cv.created_by = u.id
       WHERE cv.content_id = $1
       ORDER BY cv.version_number DESC`,
      [id]
    );

    res.json({ success: true, data: versionsResult.rows });
  } catch (error) {
    next(error);
  }
});

// Search content
router.get('/search', authenticateToken, validate(searchSchema), async (req, res, next) => {
  try {
    const { q, status, language, category, tags, date_from, date_to } = req.query;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Search query
    if (q) {
      whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.content ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Language filter
    if (language) {
      whereConditions.push(`c.language = $${paramIndex}`);
      params.push(language);
      paramIndex++;
    }

    // Category filter
    if (category) {
      whereConditions.push(`c.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Tags filter
    if (tags) {
      whereConditions.push(`c.tags && $${paramIndex}`);
      params.push(tags.split(','));
      paramIndex++;
    }

    // Date filters
    if (date_from) {
      whereConditions.push(`c.created_at >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`c.created_at <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    params.push(limit, offset);

    const contentResult = await query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url as author_avatar,
              o.name as organization_name
       FROM content c
       LEFT JOIN users u ON c.author_id = u.id
       LEFT JOIN organizations o ON c.organization_id = o.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM content c ${whereClause}`,
      params.slice(0, -2)
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: contentResult.rows,
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

export default router;


