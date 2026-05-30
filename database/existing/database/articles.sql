CREATE TABLE IF NOT EXISTS articles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  body MEDIUMTEXT NULL,
  cover_image VARCHAR(500) NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'draft',
  show_on_homepage TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  meta_title VARCHAR(255) NULL,
  meta_description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_articles_slug (slug),
  KEY idx_articles_status (status),
  KEY idx_articles_homepage (show_on_homepage),
  KEY idx_articles_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (`key`, `value`) VALUES
  ('enable_articles_page', '0'),
  ('show_articles_on_homepage', '0');
