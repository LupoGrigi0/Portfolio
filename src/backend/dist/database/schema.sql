/**
 * Database Schema for Modern Art Portfolio
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * SQLite schema for content management, social features, and analytics
 */

-- Directories table: Portfolio directory metadata
CREATE TABLE IF NOT EXISTS directories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  cover_image TEXT,
  image_count INTEGER DEFAULT 0,
  last_modified TEXT NOT NULL,
  featured BOOLEAN DEFAULT 0,
  menu_order INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('published', 'draft', 'archived')) DEFAULT 'draft',
  parent_category TEXT,
  tags TEXT, -- JSON array stored as text
  config TEXT, -- JSON configuration stored as text
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Images table: Individual image metadata
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  directory_id TEXT NOT NULL,
  carousel_id TEXT,
  position INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  small_url TEXT,
  medium_url TEXT,
  large_url TEXT,
  original_url TEXT,
  width INTEGER,
  height INTEGER,
  aspect_ratio REAL,
  file_size INTEGER,
  format TEXT,
  color_palette TEXT, -- JSON array
  average_color TEXT,
  status TEXT CHECK(status IN ('published', 'processing', 'failed')) DEFAULT 'processing',
  alt_text TEXT,
  exif_data TEXT, -- JSON object
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (directory_id) REFERENCES directories(id) ON DELETE CASCADE
);

-- Carousels table: Carousel configurations
CREATE TABLE IF NOT EXISTS carousels (
  id TEXT PRIMARY KEY,
  directory_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  layout TEXT CHECK(layout IN ('single', 'side-by-side', 'stacked')) DEFAULT 'single',
  transition_type TEXT CHECK(transition_type IN ('fade', 'slide', 'zoom', 'flip')) DEFAULT 'fade',
  autoplay_speed INTEGER DEFAULT 5000,
  show_captions BOOLEAN DEFAULT 1,
  enable_fullscreen BOOLEAN DEFAULT 1,
  background_color TEXT DEFAULT 'rgba(0,0,0,0.3)',
  position INTEGER DEFAULT 0,
  image_ids TEXT, -- JSON array of image IDs
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (directory_id) REFERENCES directories(id) ON DELETE CASCADE
);

-- Reactions table: Emoji reactions to images
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL,
  reaction_type TEXT CHECK(reaction_type IN ('like', 'love', 'wow', 'sad', 'hate', 'dislike', 'inquire', 'purchase')) NOT NULL,
  ip_hash TEXT NOT NULL,
  session_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
  UNIQUE(image_id, ip_hash, reaction_type)
);

-- Comments table: User comments on images
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL,
  parent_id TEXT,
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved', 'spam', 'deleted')) DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Inquiries table: Business inquiries from inquire/purchase reactions
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL,
  inquiry_type TEXT CHECK(inquiry_type IN ('inquire', 'purchase')) NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_company TEXT,
  message TEXT,
  intended_use TEXT,
  budget TEXT,
  status TEXT CHECK(status IN ('new', 'contacted', 'completed', 'closed')) DEFAULT 'new',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);

-- Analytics table: Track views, interactions, and engagement
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'view', 'share', 'fullscreen', etc.
  resource_type TEXT NOT NULL, -- 'image', 'directory', 'carousel'
  resource_id TEXT NOT NULL,
  ip_hash TEXT,
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata TEXT, -- JSON object for additional data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_directories_slug ON directories(slug);
CREATE INDEX IF NOT EXISTS idx_directories_status ON directories(status);
CREATE INDEX IF NOT EXISTS idx_directories_featured ON directories(featured);
CREATE INDEX IF NOT EXISTS idx_images_directory ON images(directory_id);
CREATE INDEX IF NOT EXISTS idx_images_carousel ON images(carousel_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_carousels_directory ON carousels(directory_id);
CREATE INDEX IF NOT EXISTS idx_reactions_image ON reactions(image_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_comments_image ON comments(image_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_image ON inquiries(image_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_analytics_resource ON analytics(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);