import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../middleware/errorHandler';

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new CustomError(`Validation Error: ${errorMessage}`, 400);
    }
    
    req.body = value;
    next();
  };
};

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('admin', 'teacher', 'student', 'reviewer').optional(),
    language_preference: Joi.string().valid('hindi', 'english', 'mixed').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  update: Joi.object({
    first_name: Joi.string().min(2).max(50).optional(),
    last_name: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    language_preference: Joi.string().valid('hindi', 'english', 'mixed').optional(),
    avatar_url: Joi.string().uri().optional()
  })
};

// Organization validation schemas
export const organizationSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    logo_url: Joi.string().uri().optional(),
    website: Joi.string().uri().optional(),
    contact_email: Joi.string().email().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    logo_url: Joi.string().uri().optional(),
    website: Joi.string().uri().optional(),
    contact_email: Joi.string().email().optional()
  })
};

// Content validation schemas
export const contentSchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(500).required(),
    content: Joi.string().min(10).required(),
    language: Joi.string().valid('hindi', 'english', 'mixed').required(),
    organization_id: Joi.string().uuid().optional(),
    category: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    featured_image_url: Joi.string().uri().optional()
  }),

  update: Joi.object({
    title: Joi.string().min(2).max(500).optional(),
    content: Joi.string().min(10).optional(),
    category: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    featured_image_url: Joi.string().uri().optional(),
    status: Joi.string().valid('draft', 'submitted', 'under_review', 'approved', 'rejected', 'published').optional()
  })
};

// Review validation schemas
export const reviewSchemas = {
  create: Joi.object({
    content_id: Joi.string().uuid().required(),
    reviewer_id: Joi.string().uuid().required()
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    feedback: Joi.string().max(2000).optional(),
    suggestions: Joi.string().max(2000).optional(),
    grammar_score: Joi.number().integer().min(0).max(100).optional(),
    creativity_score: Joi.number().integer().min(0).max(100).optional(),
    relevance_score: Joi.number().integer().min(0).max(100).optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed').optional()
  })
};

// Comment validation schemas
export const commentSchemas = {
  create: Joi.object({
    content_id: Joi.string().uuid().required(),
    parent_id: Joi.string().uuid().optional(),
    content: Joi.string().min(1).max(1000).required()
  })
};

// Magazine validation schemas
export const magazineSchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    cover_image_url: Joi.string().uri().optional(),
    issue_number: Joi.number().integer().min(1).required(),
    volume_number: Joi.number().integer().min(1).required(),
    publication_date: Joi.date().required(),
    organization_id: Joi.string().uuid().optional()
  })
};

// File upload validation
export const fileUploadSchema = Joi.object({
  content_id: Joi.string().uuid().optional(),
  organization_id: Joi.string().uuid().optional(),
  is_public: Joi.boolean().optional()
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

// Search validation
export const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).optional(),
  status: Joi.string().optional(),
  language: Joi.string().valid('hindi', 'english', 'mixed').optional(),
  category: Joi.string().optional(),
  tags: Joi.string().optional(),
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional()
});

// Email validation
export const emailSchema = Joi.string().email().required();

// UUID validation
export const uuidSchema = Joi.string().uuid().required();

// Password validation
export const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

// Validate file type
export const validateFileType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimeType);
};

// Validate file size
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// Validate language detection
export const detectLanguage = (text: string): 'hindi' | 'english' | 'mixed' => {
  const hindiRegex = /[\u0900-\u097F]/;
  const englishRegex = /[a-zA-Z]/;
  
  const hasHindi = hindiRegex.test(text);
  const hasEnglish = englishRegex.test(text);
  
  if (hasHindi && hasEnglish) return 'mixed';
  if (hasHindi) return 'hindi';
  if (hasEnglish) return 'english';
  return 'english'; // default
};

// Calculate reading time
export const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Generate excerpt
export const generateExcerpt = (content: string, maxLength: number = 160): string => {
  const plainText = content.replace(/<[^>]*>/g, '');
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
};


