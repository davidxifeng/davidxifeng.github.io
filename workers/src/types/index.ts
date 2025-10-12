/**
 * TypeScript Types for Playground API
 */

// ==================== Environment Types ====================

export interface Env {
  // D1 Database binding
  DB: D1Database

  // R2 Storage binding
  STORAGE: R2Bucket

  // Environment variables
  ENVIRONMENT: 'development' | 'production'
  ALLOWED_ORIGINS: string

  // Secrets (set via `wrangler secret put`)
  JWT_SECRET: string
  ADMIN_EMAIL?: string
  RESEND_API_KEY?: string
}

// ==================== Database Models ====================

export interface User {
  id: string
  email: string
  username: string
  password_hash: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: 'admin' | 'user'
  email_verified: number
  created_at: number
  updated_at: number
}

export interface Session {
  id: string
  user_id: string
  token_hash: string
  expires_at: number
  created_at: number
}

export interface VerificationCode {
  id: string
  email: string
  code: string
  type: 'register' | 'reset_password' | 'verify_email'
  expires_at: number
  used: number
  created_at: number
}

export interface Comment {
  id: string
  post_slug: string
  user_id: string
  parent_id: string | null
  content: string
  status: 'pending' | 'approved' | 'rejected'
  likes_count: number
  created_at: number
  updated_at: number
}

export interface Post {
  id: string
  user_id: string
  content: string
  images: string | null
  visibility: 'public' | 'private'
  likes_count: number
  comments_count: number
  created_at: number
  updated_at: number
}

export interface Like {
  id: string
  user_id: string
  target_type: 'comment' | 'post'
  target_id: string
  created_at: number
}

export interface PageView {
  id: string
  path: string
  user_id: string | null
  ip_hash: string | null
  user_agent: string | null
  referrer: string | null
  country: string | null
  created_at: number
}

export interface AnalyticsDaily {
  date: string
  path: string
  views: number
  unique_visitors: number
}

// ==================== API Request/Response Types ====================

// Auth
export interface RegisterRequest {
  email: string
  username: string
  password: string
  verification_code: string
  display_name?: string
}

export interface LoginRequest {
  username: string // email or username
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  user: UserPublic
}

export interface UserPublic {
  id: string
  email: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: 'admin' | 'user'
  email_verified: boolean
  created_at: number
}

export interface VerifyCodeRequest {
  email: string
  type: 'register' | 'reset_password' | 'verify_email'
}

// Comments
export interface CreateCommentRequest {
  post_slug: string
  content: string
  parent_id?: string
}

export interface UpdateCommentRequest {
  content: string
}

export interface CommentWithUser extends Comment {
  user: UserPublic
  replies?: CommentWithUser[]
  is_liked?: boolean
}

// Posts (Feed)
export interface CreatePostRequest {
  content: string
  images?: string[]
  visibility?: 'public' | 'private'
}

export interface UpdatePostRequest {
  content?: string
  images?: string[]
  visibility?: 'public' | 'private'
}

export interface PostWithUser extends Post {
  user: UserPublic
  images_array: string[]
  is_liked?: boolean
}

// Analytics
export interface TrackPageViewRequest {
  path: string
  referrer?: string
}

export interface AnalyticsStats {
  total_views: number
  unique_visitors: number
  popular_pages: Array<{
    path: string
    views: number
  }>
  daily_stats: Array<{
    date: string
    views: number
    unique_visitors: number
  }>
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// ==================== JWT Payload ====================

export interface JWTPayload {
  sub: string // user_id
  email: string
  username: string
  role: 'admin' | 'user'
  iat: number
  exp: number
}

// ==================== Error Response ====================

export interface ErrorResponse {
  error: string
  message: string
  status: number
  details?: any
}
