import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireAdmin, requireTeacher } from '../middleware/auth';
import { validate } from '../utils/validation';
import { magazineSchemas, paginationSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';
import { UserRole, ContentStatus } from '../types';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get all magazines
router.get('/', authenticateToken, validate(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const magazinesResult = await query(
      `SELECT m.*, u.first_name, u.last_name as creator_name,
              o.name as organization_name
       FROM magazines m
       LEFT JOIN users u ON m.created_by = u.id
       LEFT JOIN organizations o ON m.organization_id = o.id
       ORDER BY m.${sort} ${order}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM magazines');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: magazinesResult.rows,
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

// Get magazine by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const magazineResult = await query(
      `SELECT m.*, u.first_name, u.last_name as creator_name,
              o.name as organization_name
       FROM magazines m
       LEFT JOIN users u ON m.created_by = u.id
       LEFT JOIN organizations o ON m.organization_id = o.id
       WHERE m.id = $1`,
      [id]
    );

    if (magazineResult.rows.length === 0) {
      throw new CustomError('Magazine not found', 404);
    }

    res.json({ success: true, data: magazineResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Create magazine
router.post('/', authenticateToken, requireTeacher, validate(magazineSchemas.create), async (req, res, next) => {
  try {
    const { title, description, cover_image_url, issue_number, volume_number, publication_date, organization_id } = req.body;
    const created_by = req.user?.user_id;

    // Check if issue already exists for this organization
    if (organization_id) {
      const existingIssue = await query(
        'SELECT id FROM magazines WHERE organization_id = $1 AND issue_number = $2 AND volume_number = $3',
        [organization_id, issue_number, volume_number]
      );

      if (existingIssue.rows.length > 0) {
        throw new CustomError('Magazine issue already exists for this organization', 409);
      }
    }

    const result = await query(
      `INSERT INTO magazines (title, description, cover_image_url, issue_number, volume_number, 
                             publication_date, organization_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description, cover_image_url, issue_number, volume_number, publication_date, organization_id, created_by]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update magazine
router.put('/:id', authenticateToken, requireTeacher, validate(magazineSchemas.create), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user can update this magazine
    const magazineResult = await query('SELECT created_by, status FROM magazines WHERE id = $1', [id]);
    if (magazineResult.rows.length === 0) {
      throw new CustomError('Magazine not found', 404);
    }

    const magazine = magazineResult.rows[0];
    if (magazine.created_by !== req.user?.user_id && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    // Don't allow updates to published magazines unless admin
    if (magazine.status === ContentStatus.PUBLISHED && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Cannot update published magazine', 400);
    }

    const updateFields = Object.keys(updates);
    const updateValues = Object.values(updates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await query(
      `UPDATE magazines SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id, ...updateValues]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete magazine
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM magazines WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new CustomError('Magazine not found', 404);
    }

    res.json({ success: true, message: 'Magazine deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add content to magazine
router.post('/:id/content', authenticateToken, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content_id, page_number, order_index } = req.body;

    // Check if magazine exists
    const magazineResult = await query('SELECT id FROM magazines WHERE id = $1', [id]);
    if (magazineResult.rows.length === 0) {
      throw new CustomError('Magazine not found', 404);
    }

    // Check if content exists and is approved
    const contentResult = await query('SELECT id, status FROM content WHERE id = $1', [content_id]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    if (contentResult.rows[0].status !== ContentStatus.APPROVED) {
      throw new CustomError('Content must be approved to be added to magazine', 400);
    }

    // Check if content is already in magazine
    const existingContent = await query(
      'SELECT id FROM magazine_content WHERE magazine_id = $1 AND content_id = $2',
      [id, content_id]
    );

    if (existingContent.rows.length > 0) {
      throw new CustomError('Content is already in magazine', 409);
    }

    const result = await query(
      `INSERT INTO magazine_content (magazine_id, content_id, page_number, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, content_id, page_number, order_index]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Remove content from magazine
router.delete('/:id/content/:contentId', authenticateToken, requireTeacher, async (req, res, next) => {
  try {
    const { id, contentId } = req.params;

    const result = await query(
      'DELETE FROM magazine_content WHERE magazine_id = $1 AND content_id = $2 RETURNING id',
      [id, contentId]
    );

    if (result.rows.length === 0) {
      throw new CustomError('Content not found in magazine', 404);
    }

    res.json({ success: true, message: 'Content removed from magazine' });
  } catch (error) {
    next(error);
  }
});

// Get magazine content
router.get('/:id/content', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const contentResult = await query(
      `SELECT mc.*, c.title, c.content, c.excerpt, c.author_id, c.language,
              u.first_name, u.last_name
       FROM magazine_content mc
       LEFT JOIN content c ON mc.content_id = c.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE mc.magazine_id = $1
       ORDER BY mc.order_index`,
      [id]
    );

    res.json({ success: true, data: contentResult.rows });
  } catch (error) {
    next(error);
  }
});

// Generate magazine PDF
router.post('/:id/generate-pdf', authenticateToken, requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get magazine details
    const magazineResult = await query(
      `SELECT m.*, o.name as organization_name
       FROM magazines m
       LEFT JOIN organizations o ON m.organization_id = o.id
       WHERE m.id = $1`,
      [id]
    );

    if (magazineResult.rows.length === 0) {
      throw new CustomError('Magazine not found', 404);
    }

    const magazine = magazineResult.rows[0];

    // Get magazine content
    const contentResult = await query(
      `SELECT mc.*, c.title, c.content, c.excerpt, c.author_id, c.language,
              u.first_name, u.last_name
       FROM magazine_content mc
       LEFT JOIN content c ON mc.content_id = c.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE mc.magazine_id = $1
       ORDER BY mc.order_index`,
      [id]
    );

    // Generate PDF
    const pdfBuffer = await generateMagazinePDF(magazine, contentResult.rows);

    // Save PDF file
    const pdfDir = process.env.PDF_OUTPUT_DIR || 'pdfs';
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filename = `magazine-${magazine.issue_number}-${magazine.volume_number}-${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);
    fs.writeFileSync(filepath, pdfBuffer);

    // Update magazine with PDF URL
    const pdfUrl = `/api/files/pdf/${filename}`;
    await query(
      'UPDATE magazines SET pdf_url = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [pdfUrl, ContentStatus.PUBLISHED, id]
    );

    res.json({ 
      success: true, 
      data: { 
        pdf_url: pdfUrl,
        filename: filename,
        status: ContentStatus.PUBLISHED
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate magazine PDF
async function generateMagazinePDF(magazine: any, content: any[]): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Generate HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${magazine.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .issue { font-size: 16px; color: #666; }
        .content { margin-bottom: 30px; }
        .article-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .article-author { font-size: 14px; color: #666; margin-bottom: 15px; }
        .article-content { line-height: 1.6; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${magazine.title}</div>
        <div class="issue">Issue ${magazine.issue_number}, Volume ${magazine.volume_number}</div>
        <div class="issue">${new Date(magazine.publication_date).toLocaleDateString()}</div>
      </div>
      
      ${content.map((item, index) => `
        <div class="content ${index > 0 ? 'page-break' : ''}">
          <div class="article-title">${item.title}</div>
          <div class="article-author">By ${item.first_name} ${item.last_name}</div>
          <div class="article-content">${item.content}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `;

  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });

  await browser.close();
  return pdfBuffer;
}

export default router;


