-- =====================================================
-- Playground API Database Schema
-- Database: D1 (SQLite)
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  email_verified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 会话/Token表 (可选，用于 Token 黑名单或多设备登录管理)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('register', 'reset_password', 'verify_email')),
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- 博客评论表
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  parent_id TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
  likes_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_slug ON comments(post_slug);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- 动态 Feed 表
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT, -- JSON array of R2 URLs
  visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('comment', 'post')),
  target_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- 访客统计表
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  user_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX idx_page_views_user_id ON page_views(user_id);

-- 访客统计聚合表（按天聚合，提高查询性能）
CREATE TABLE IF NOT EXISTS analytics_daily (
  date TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  PRIMARY KEY (date, path)
);

CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);
