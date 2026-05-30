CREATE TABLE IF NOT EXISTS videos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  youtube_url VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(32) NOT NULL,
  youtube_embed_url VARCHAR(500) NOT NULL,
  short_description TEXT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'draft',
  show_on_homepage TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_videos_slug (slug),
  KEY idx_videos_status (status),
  KEY idx_videos_homepage (show_on_homepage),
  KEY idx_videos_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (`key`, `value`) VALUES
  ('enable_videos_page', '0'),
  ('show_videos_on_homepage', '0');
