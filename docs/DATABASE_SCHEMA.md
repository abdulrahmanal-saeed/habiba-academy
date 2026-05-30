# DATABASE_SCHEMA.md — Habiba Nabil Arabic Academy
# Database Reference

> Database: `u807160300_smarthomework` @ localhost
> Charset: utf8mb4 / utf8mb4_unicode_ci
> Engine: InnoDB
> Timezone: Asia/Dubai (set per connection in config/db.php)

---

## Core Tables (from existing site)

### students
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(255)
email           VARCHAR(255) UNIQUE
phone           VARCHAR(50)
password_hash   VARCHAR(255)
status          ENUM('active','inactive')
package_name    VARCHAR(100)
sessions_remaining INT DEFAULT 0
parent_id       INT NULL (FK → parents.id)
created_at      DATETIME
last_login      DATETIME NULL
```

### homeworks / reviews / scenarios
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
student_id      INT (FK → students.id)
teacher_id      INT
title           VARCHAR(255)
type            VARCHAR(50)
status          ENUM('pending','submitted','reviewed')
created_at      DATETIME
due_date        DATETIME NULL
-- + type-specific columns
```

### notifications (platform in-app)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
user_id         INT
user_type       ENUM('student','parent','academy','media_buyer','teacher')
type            VARCHAR(50)
title           VARCHAR(255)
body            TEXT
is_read         TINYINT(1) DEFAULT 0
link            VARCHAR(255) NULL
created_at      DATETIME
```

### notification_delivery_log (from lib/notify.php)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
item_type       VARCHAR(40)    -- 'homework', 'review', etc.
item_id         INT
channel         VARCHAR(20)    -- 'email', 'push', 'platform'
recipient       VARCHAR(255)
sent_at         DATETIME
UNIQUE KEY (item_type, item_id, channel, recipient(191))
```

### site_settings (from database/site_settings.sql)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
key             VARCHAR(100) UNIQUE
value           TEXT
updated_at      DATETIME
-- Used by lib/settings.php for all feature flags and config
```

### articles (from database/articles.sql)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
title           VARCHAR(255)
slug            VARCHAR(255) UNIQUE
content         LONGTEXT
excerpt         TEXT
category        VARCHAR(100)
status          ENUM('draft','published')
published_at    DATETIME NULL
created_at      DATETIME
```

### videos (from database/videos.sql)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
title           VARCHAR(255)
url             VARCHAR(500)
thumbnail       VARCHAR(500)
category        VARCHAR(100)
status          ENUM('draft','published')
sort_order      INT DEFAULT 0
created_at      DATETIME
```

### student_briefs (from database/student_briefs.sql)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
academy_id      INT (FK → academies.id)
student_name    VARCHAR(255)
student_email   VARCHAR(255)
level           VARCHAR(50)
goals           TEXT
status          ENUM('pending','reviewed','accepted','rejected')
teacher_notes   TEXT NULL
created_at      DATETIME
updated_at      DATETIME
```

### analytics_events (from database/analytics.sql)
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
event_type      VARCHAR(100)
session_id      VARCHAR(255)
user_id         INT NULL
role            VARCHAR(50) NULL
referrer        VARCHAR(500) NULL
media_buyer_ref VARCHAR(255) NULL
meta            JSON NULL
created_at      DATETIME
```

### mobile_app (from database/mobile_app_integration.sql)
```sql
-- FCM tokens, mobile sessions, sync state
-- See migration file for full schema
```

### Book tables
```sql
book_units         -- book unit/chapter metadata
book_lessons       -- individual lessons with content
book_submissions   -- student submissions per lesson
book_access        -- which students have book access
book_weak_words    -- vocabulary flagged by student
```

### Level test tables
```sql
leveltest_sessions     -- test attempts
leveltest_answers      -- per-question answers
leveltest_bank         -- question bank (from tools/import-leveltest-bank.php)
```

---

## migrations/ — New Tables for Rebuild

Create new tables here as needed. Naming: `YYYYMMDD_description.sql`

```sql
-- Example migration format:
-- database/migrations/20260601_add_flashcard_progress.sql

CREATE TABLE IF NOT EXISTS flashcard_progress (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    word_id         INT NOT NULL,
    difficulty      ENUM('new','learning','review','mastered') DEFAULT 'new',
    next_review_at  DATETIME NOT NULL,
    review_count    INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (student_id, word_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Feature Flags (via site_settings)

The `lib/settings.php` and `ensure_feature_flag_settings()` function manages these:

```
book_launch_active          0|1    Is the Interactive Book available?
ziina_test_mode             0|1    Use Ziina sandbox?
ai_enabled                  0|1    AI tools available to teachers?
maintenance_mode            0|1    Site in maintenance?
max_ai_calls_per_day        50     Rate limit for AI tools
```

Read via `payment_setting($key)` from `lib/settings.php`.

---

## Important Notes

1. **Never drop tables** — real user data exists
2. **New columns**: use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
3. **New tables**: use `CREATE TABLE IF NOT EXISTS`
4. **All migrations**: must be reversible (add `-- ROLLBACK:` comment)
5. **Timezone**: always set in PHP via `SET time_zone = '+04:00'` (Dubai)
6. **Charset**: always `utf8mb4` for Arabic text support
