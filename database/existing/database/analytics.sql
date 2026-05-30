CREATE TABLE IF NOT EXISTS visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  user_id INT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  device_type ENUM('desktop','mobile','tablet') NOT NULL DEFAULT 'desktop',
  browser VARCHAR(50) NULL,
  referrer VARCHAR(500) NULL,
  country VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_visits_session_id (session_id),
  KEY idx_visits_created_at (created_at),
  KEY idx_visits_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  page_url VARCHAR(500) NOT NULL,
  page_title VARCHAR(255) NULL,
  time_spent INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_page_views_session_id (session_id),
  KEY idx_page_views_created_at (created_at),
  KEY idx_page_views_page_url (page_url(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_events_session_id (session_id),
  KEY idx_events_event_name (event_name),
  KEY idx_events_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
