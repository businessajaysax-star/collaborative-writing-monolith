// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  language_preference: LanguageType;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Content types
export interface Content {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  language: LanguageType;
  status: ContentStatus;
  author_id: string;
  organization_id?: string;
  category?: string;
  tags?: string[];
  word_count: number;
  reading_time: number;
  featured_image_url?: string;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// Review types
export interface Review {
  id: string;
  content_id: string;
  reviewer_id: string;
  status: ReviewStatus;
  rating?: number;
  feedback?: string;
  suggestions?: string;
  grammar_score?: number;
  creativity_score?: number;
  relevance_score?: number;
  assigned_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Magazine types
export interface Magazine {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  issue_number: number;
  volume_number: number;
  publication_date: string;
  organization_id?: string;
  status: ContentStatus;
  pdf_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

// File types
export interface File {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  uploaded_by: string;
  content_id?: string;
  organization_id?: string;
  is_public: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  REVIEWER = 'reviewer'
}

export enum ContentStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}

export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum NotificationType {
  CONTENT_SUBMITTED = 'content_submitted',
  REVIEW_ASSIGNED = 'review_assigned',
  REVIEW_COMPLETED = 'review_completed',
  CONTENT_APPROVED = 'content_approved',
  CONTENT_REJECTED = 'content_rejected',
  MAGAZINE_PUBLISHED = 'magazine_published',
  COMMENT_ADDED = 'comment_added'
}

export enum LanguageType {
  HINDI = 'hindi',
  ENGLISH = 'english',
  MIXED = 'mixed'
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  language_preference?: LanguageType;
}

export interface ContentForm {
  title: string;
  content: string;
  language: LanguageType;
  organization_id?: string;
  category?: string;
  tags?: string[];
  featured_image_url?: string;
}

export interface ReviewForm {
  rating?: number;
  feedback?: string;
  suggestions?: string;
  grammar_score?: number;
  creativity_score?: number;
  relevance_score?: number;
}

// Filter types
export interface ContentFilters {
  status?: ContentStatus;
  language?: LanguageType;
  author_id?: string;
  organization_id?: string;
  category?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface UserFilters {
  role?: UserRole;
  organization_id?: string;
  is_active?: boolean;
  search?: string;
}


