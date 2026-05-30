CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(190) NOT NULL PRIMARY KEY,
  `value` TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (`key`, `value`) VALUES
  ('enable_videos_page', '0'),
  ('show_videos_on_homepage', '0'),
  ('enable_articles_page', '0'),
  ('show_articles_on_homepage', '0');
