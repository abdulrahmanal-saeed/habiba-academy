-- Mobile app integration migration.
-- Run once on production before deploying the updated /api/mobile endpoints.

ALTER TABLE lesson_plan_sessions
  ADD COLUMN IF NOT EXISTS session_time TIME NULL AFTER planned_date,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 120 AFTER teacher_notes,
  ADD COLUMN IF NOT EXISTS subject VARCHAR(120) NOT NULL DEFAULT 'عربي' AFTER price,
  ADD COLUMN IF NOT EXISTS is_paid TINYINT(1) NOT NULL DEFAULT 0 AFTER subject,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL DEFAULT NULL AFTER created_at;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS color_index INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_price DECIMAL(10,2) NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS default_subject VARCHAR(120) NOT NULL DEFAULT 'عربي',
  ADD COLUMN IF NOT EXISTS parent_name VARCHAR(160) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL DEFAULT NULL;

UPDATE students
SET default_price = 120
WHERE default_price IS NULL OR default_price <= 0;

UPDATE students
SET default_subject = 'عربي'
WHERE default_subject IS NULL OR default_subject = '';

UPDATE lesson_plan_sessions
SET price = 120
WHERE price IS NULL OR price <= 0;

UPDATE lesson_plan_sessions
SET subject = 'عربي'
WHERE subject IS NULL OR subject = '';

UPDATE lesson_plan_sessions
SET is_paid = 1
WHERE status = 'completed';

CREATE TABLE IF NOT EXISTS student_mobile_schedule (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  session_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  price_override DECIMAL(10,2) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL,
  UNIQUE KEY uniq_student_day (student_id, day_of_week),
  KEY idx_student_mobile_schedule_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mobile_ai_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  report_json JSON NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mobile_ai_reports_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS push_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_type ENUM('teacher','student') NOT NULL,
  user_id INT NOT NULL DEFAULT 0,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  url VARCHAR(512) DEFAULT NULL,
  wa_url VARCHAR(512) DEFAULT NULL,
  icon VARCHAR(255) DEFAULT '/assets/img/icon-192.png',
  shown_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_type, user_id, shown_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mobile_fcm_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_type ENUM('teacher','student') NOT NULL DEFAULT 'teacher',
  user_id INT NOT NULL DEFAULT 0,
  token VARCHAR(255) NOT NULL UNIQUE,
  platform VARCHAR(40) NOT NULL DEFAULT 'android',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME NULL DEFAULT NULL,
  INDEX idx_mobile_fcm_user (user_type, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
