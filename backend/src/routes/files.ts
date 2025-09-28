import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { fileUploadSchema, paginationSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';
import { UserRole } from '../types';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new CustomError('File type not allowed', 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), validate(fileUploadSchema), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new CustomError('No file uploaded', 400);
    }

    const { content_id, organization_id, is_public = false } = req.body;
    const uploaded_by = req.user?.user_id;

    // Process image files with Sharp
    let processedPath = req.file.path;
    if (req.file.mimetype.startsWith('image/')) {
      const processedFilename = `processed_${req.file.filename}`;
      const processedFilePath = path.join(path.dirname(req.file.path), processedFilename);
      
      await sharp(req.file.path)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(processedFilePath);
      
      // Remove original file and rename processed file
      fs.unlinkSync(req.file.path);
      fs.renameSync(processedFilePath, req.file.path);
    }

    // Save file record to database
    const result = await query(
      `INSERT INTO files (filename, original_name, mime_type, size, path, url, uploaded_by, content_id, organization_id, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.path,
        `/api/files/${req.file.filename}`,
        uploaded_by,
        content_id || null,
        organization_id || null,
        is_public
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new CustomError('No files uploaded', 400);
    }

    const { content_id, organization_id, is_public = false } = req.body;
    const uploaded_by = req.user?.user_id;
    const files = req.files as Express.Multer.File[];

    const fileRecords = [];

    for (const file of files) {
      // Process image files
      if (file.mimetype.startsWith('image/')) {
        const processedFilename = `processed_${file.filename}`;
        const processedFilePath = path.join(path.dirname(file.path), processedFilename);
        
        await sharp(file.path)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(processedFilePath);
        
        fs.unlinkSync(file.path);
        fs.renameSync(processedFilePath, file.path);
      }

      const result = await query(
        `INSERT INTO files (filename, original_name, mime_type, size, path, url, uploaded_by, content_id, organization_id, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          file.path,
          `/api/files/${file.filename}`,
          uploaded_by,
          content_id || null,
          organization_id || null,
          is_public
        ]
      );

      fileRecords.push(result.rows[0]);
    }

    res.status(201).json({ success: true, data: fileRecords });
  } catch (error) {
    next(error);
  }
});

// Get files
router.get('/', authenticateToken, validate(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const userId = req.user?.user_id;

    let whereClause = 'WHERE f.uploaded_by = $3';
    const params: any[] = [limit, offset, userId];

    // Admins can see all files
    if (req.user?.role === UserRole.ADMIN) {
      whereClause = '';
      params.pop(); // Remove userId from params
    }

    const filesResult = await query(
      `SELECT f.*, u.first_name, u.last_name as uploader_name
       FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM files f ${whereClause}`,
      params.slice(2)
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: filesResult.rows,
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

// Get file by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;

    const fileResult = await query(
      `SELECT f.*, u.first_name, u.last_name as uploader_name
       FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.id = $1`,
      [id]
    );

    if (fileResult.rows.length === 0) {
      throw new CustomError('File not found', 404);
    }

    const file = fileResult.rows[0];

    // Check access permissions
    if (file.uploaded_by !== userId && !file.is_public && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    res.json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
});

// Download file
router.get('/download/:filename', authenticateToken, async (req, res, next) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.user_id;

    const fileResult = await query(
      'SELECT * FROM files WHERE filename = $1',
      [filename]
    );

    if (fileResult.rows.length === 0) {
      throw new CustomError('File not found', 404);
    }

    const file = fileResult.rows[0];

    // Check access permissions
    if (file.uploaded_by !== userId && !file.is_public && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const filePath = path.join(process.cwd(), file.path);
    
    if (!fs.existsSync(filePath)) {
      throw new CustomError('File not found on disk', 404);
    }

    res.download(filePath, file.original_name);
  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;

    const fileResult = await query('SELECT * FROM files WHERE id = $1', [id]);

    if (fileResult.rows.length === 0) {
      throw new CustomError('File not found', 404);
    }

    const file = fileResult.rows[0];

    // Check access permissions
    if (file.uploaded_by !== userId && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete file record from database
    await query('DELETE FROM files WHERE id = $1', [id]);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get files by content ID
router.get('/content/:contentId', authenticateToken, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?.user_id;

    // Check if user can access this content
    const contentResult = await query('SELECT author_id FROM content WHERE id = $1', [contentId]);
    if (contentResult.rows.length === 0) {
      throw new CustomError('Content not found', 404);
    }

    const content = contentResult.rows[0];
    if (content.author_id !== userId && req.user?.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied', 403);
    }

    const filesResult = await query(
      `SELECT f.*, u.first_name, u.last_name as uploader_name
       FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.content_id = $1
       ORDER BY f.created_at DESC`,
      [contentId]
    );

    res.json({ success: true, data: filesResult.rows });
  } catch (error) {
    next(error);
  }
});

export default router;


