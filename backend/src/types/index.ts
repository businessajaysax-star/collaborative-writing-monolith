// User types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  language_preference: LanguageType;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  language_preference?: LanguageType;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  bio?: string;
  language_preference?: LanguageType;
  avatar_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  access_token: string;
  refresh_token: string;
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
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  joined_at: Date;
  is_active: boolean;
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
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContentRequest {
  title: string;
  content: string;
  language: LanguageType;
  organization_id?: string;
  category?: string;
  tags?: string[];
  featured_image_url?: string;
}

export interface UpdateContentRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  featured_image_url?: string;
  status?: ContentStatus;
}

export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  content: string;
  changes_summary?: string;
  created_by: string;
  created_at: Date;
}

// Comment types
export interface Comment {
  id: string;
  content_id: string;
  parent_id?: string;
  author_id: string;
  content: string;
  is_resolved: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCommentRequest {
  content_id: string;
  parent_id?: string;
  content: string;
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
  assigned_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReviewRequest {
  content_id: string;
  reviewer_id: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  feedback?: string;
  suggestions?: string;
  grammar_score?: number;
  creativity_score?: number;
  relevance_score?: number;
  status?: ReviewStatus;
}

export interface ReviewCriteria {
  id: string;
  review_id: string;
  criteria_name: string;
  score: number;
  comments?: string;
  created_at: Date;
}

// Magazine types
export interface Magazine {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  issue_number: number;
  volume_number: number;
  publication_date: Date;
  organization_id?: string;
  status: ContentStatus;
  pdf_url?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMagazineRequest {
  title: string;
  description?: string;
  cover_image_url?: string;
  issue_number: number;
  volume_number: number;
  publication_date: Date;
  organization_id?: string;
}

export interface MagazineContent {
  id: string;
  magazine_id: string;
  content_id: string;
  page_number?: number;
  order_index: number;
  created_at: Date;
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
  created_at: Date;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
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
  created_at: Date;
}

export interface FileUploadRequest {
  content_id?: string;
  organization_id?: string;
  is_public?: boolean;
}

// Analytics types
export interface Analytics {
  id: string;
  event_type: string;
  user_id?: string;
  content_id?: string;
  organization_id?: string;
  data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
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

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// JWT Payload
export interface JWTPayload {
  user_id: string;
  email: string;
  role: UserRole;
  organization_id?: string;
  iat?: number;
  exp?: number;
}

// Socket.IO types
export interface SocketData {
  user_id: string;
  organization_id?: string;
}

export interface SocketEvents {
  'content:update': (data: { content_id: string; content: string; user_id: string }) => void;
  'comment:new': (data: { content_id: string; comment: Comment }) => void;
  'review:assigned': (data: { review_id: string; reviewer_id: string }) => void;
  'notification:new': (data: { user_id: string; notification: Notification }) => void;
}

// Search and filter types
export interface ContentFilters {
  status?: ContentStatus;
  language?: LanguageType;
  author_id?: string;
  organization_id?: string;
  category?: string;
  tags?: string[];
  date_from?: Date;
  date_to?: Date;
  search?: string;
}

export interface UserFilters {
  role?: UserRole;
  organization_id?: string;
  is_active?: boolean;
  search?: string;
}

// Statistics types
export interface ContentStats {
  total_content: number;
  published_content: number;
  draft_content: number;
  under_review_content: number;
  total_words: number;
  average_reading_time: number;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  users_by_role: Record<UserRole, number>;
  new_users_this_month: number;
}

export interface OrganizationStats {
  total_organizations: number;
  active_organizations: number;
  total_members: number;
  average_members_per_organization: number;
}


