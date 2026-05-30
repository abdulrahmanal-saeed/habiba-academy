# Sprint 5.8 Analysis — Teacher Notifications + Settings + Help Center CMS

## 1. Scope

Three new teacher features:

| Feature | Backend files | Frontend feature |
|---|---|---|
| In-app Notifications | `notifications.php` | `features/notifications/` |
| Site Settings | `settings.php` | `features/settings/` |
| Help Center CMS | `help-articles.php`, `help-categories.php` | `features/help-center-cms/` |

Neither `notifications.php` nor `settings.php` exist in the source `New/Core/api/teacher/` — these are **new endpoints** designed from the underlying lib files.

---

## 2. Source PHP Libraries Analyzed

### 2.1 `lib/settings.php`

Key-value site settings store.

- Auto-discovers table: checks for `site_settings` first, then `settings`
- `get_setting($pdo, $key, $default = null)` → returns stored value or default
- `update_setting($pdo, $key, $value)` → INSERT … ON DUPLICATE KEY UPDATE
- `setting_enabled($pdo, $key, bool $default = false)` → bool cast

Seeded feature flags (existing data):
- `enable_videos_page`, `show_videos_on_homepage`
- `enable_articles_page`, `show_articles_on_homepage`

Table schema:
```sql
site_settings (
  id              INT PK AUTO_INCREMENT,
  setting_key     VARCHAR(100) UNIQUE,
  setting_value   TEXT,
  created_at      DATETIME,
  updated_at      DATETIME
)
```

### 2.2 `lib/help-center.php`

Full help center CMS backend.

Functions:
- `help_ensure_schema($pdo)` — creates all 4 tables (idempotent)
- `help_seed_defaults($pdo)` — seeds 6 categories + 6 starter articles
- `help_categories($pdo, $role, $activeOnly = true)` — list by role visibility
- `help_list_articles($pdo, $filters)` — filters: `role`, `visible_role`, `status`, `category_id`, `featured`, `q`
- `help_save_article($pdo, $data, $id = null)` — upsert article; auto-slugifies title
- `help_save_category($pdo, $data, $id = null)` — upsert category
- `help_checklist_items($role)` — returns onboarding checklist items per role
- `help_progress_for($pdo, $userId, $role)` — onboarding checklist progress

Tables:
```sql
help_categories (
  id          INT PK AUTO_INCREMENT,
  slug        VARCHAR(100) UNIQUE,
  title       VARCHAR(255),
  icon        VARCHAR(100),   -- e.g. 'BookOpen', 'HelpCircle'
  sort_order  INT DEFAULT 0,
  roles       VARCHAR(255),   -- CSV: 'student,teacher,parent'
  active      TINYINT(1) DEFAULT 1,
  created_at  DATETIME
)

help_articles (
  id            INT PK AUTO_INCREMENT,
  category_id   INT → help_categories,
  slug          VARCHAR(150) UNIQUE,
  title         VARCHAR(255),
  content       MEDIUMTEXT,
  visible_roles VARCHAR(255),  -- CSV: 'student,teacher'
  featured      TINYINT(1) DEFAULT 0,
  status        VARCHAR(40) DEFAULT 'draft',  -- 'published' | 'draft'
  sort_order    INT DEFAULT 0,
  created_at    DATETIME,
  updated_at    DATETIME
)

user_onboarding_progress (
  id           INT PK AUTO_INCREMENT,
  user_type    VARCHAR(40),
  user_id      INT,
  item_key     VARCHAR(100),
  completed_at DATETIME,
  UNIQUE (user_type, user_id, item_key)
)

user_tour_progress (
  id           INT PK AUTO_INCREMENT,
  user_type    VARCHAR(40),
  user_id      INT,
  tour_key     VARCHAR(100),
  step         INT DEFAULT 0,
  completed_at DATETIME NULL,
  UNIQUE (user_type, user_id, tour_key)
)
```

### 2.3 `lib/platform-notifications.php`

Extends `push_notifications` table (from `communications.php`) with:
- Columns added: `target_role`, `related_entity_type`, `related_entity_id`, `action_label`, `priority`

Functions:
- `platform_notify($pdo, $data)` → int — inserts row, auto-generates `event_key` if missing, calls `communications_log_push()`
- `platform_notification_unread_count($pdo, $role, $userId)` → int
- `platform_notification_mark_read($pdo, $id, $role, $userId)` → bool — sets `read_at = COALESCE(read_at, NOW())`

### 2.4 `lib/book-notifications.php`

Extends `push_notifications` further with book-specific columns:
- `notification_type`, `title_en`, `title_ar`, `body_en`, `body_ar`
- `is_read` TINYINT (mirrors `read_at IS NOT NULL`)
- `student_id`, `teacher_id`, `book_id`, `unit_id`, `submission_id`, `activation_request_id`
- `metadata_json` LONGTEXT, `channel_in_app`, `channel_email`, `channel_whatsapp`

Key functions:
- `create_book_notification($pdo, $data)` → deduplicates by `event_key` before insert
- `mark_book_notification_read($pdo, $notificationId, $recipientType, $recipientId)` — sets both `read_at` and `is_read = 1`
- `mark_related_book_notifications_read($pdo, $type, $meta)` — bulk mark-read by type + entity IDs
- `get_book_unread_notification_count($pdo, $type, $userId)` — counts `notification_type LIKE 'book_%'`

### 2.5 `lib/student-notification-reads.php`

Separate read-tracking for student-side notifications (not `push_notifications` read_at, but a dedicated lookup table).

- Table: `student_notification_reads (id, student_id, notification_key, read_at)` — UNIQUE on `(student_id, notification_key)`
- `student_notification_key($type, $id)` → `"type:id"` string key
- `student_notification_mark_read($pdo, $studentId, $key)` — upsert
- `student_notification_read_keys($pdo, $studentId)` → `array_flip()` for O(1) membership test

**Note:** This lib is for the student role. Teacher notifications use `push_notifications.read_at` directly.

---

## 3. Full `push_notifications` Table (after all migrations)

```sql
push_notifications (
  id                     INT PK AUTO_INCREMENT,
  user_type              VARCHAR(40),       -- 'teacher' | 'student' | etc.
  user_id                INT,
  target_role            VARCHAR(40),       -- same as user_type normally
  notification_type      VARCHAR(100),      -- 'book_lesson_submitted', etc.
  title                  VARCHAR(255),
  title_en               VARCHAR(255),
  title_ar               VARCHAR(255),
  body                   TEXT,
  body_en                TEXT,
  body_ar                TEXT,
  url                    VARCHAR(512),
  wa_url                 VARCHAR(512),
  wa_message             TEXT,
  event_key              VARCHAR(255),      -- dedup key
  related_entity_type    VARCHAR(80),
  related_entity_id      INT DEFAULT 0,
  action_label           VARCHAR(120),
  priority               VARCHAR(30),       -- 'low' | 'normal' | 'high'
  student_id             INT NULL,
  teacher_id             INT NULL,
  book_id                INT NULL,
  unit_id                INT NULL,
  submission_id          INT NULL,
  activation_request_id  INT NULL,
  metadata_json          LONGTEXT NULL,
  channel_in_app         TINYINT(1) DEFAULT 1,
  channel_email          TINYINT(1) DEFAULT 0,
  channel_whatsapp       TINYINT(1) DEFAULT 0,
  is_read                TINYINT(1) DEFAULT 0,
  shown_at               DATETIME NULL,
  read_at                DATETIME NULL,
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_type, user_id, shown_at),
  INDEX (user_type, user_id, read_at)
)
```

---

## 4. New Backend Endpoints

All endpoints in `backend/api/teacher/`. Path prefix: `../../lib/lib/helpers.php`, `../../config/config/db.php`.

### 4.1 `notifications.php`

```
GET  notifications.php               → list teacher notifications
POST notifications.php (FormData)    → mark-read or mark-all-read
```

**GET params (optional):** `?limit=20&offset=0&unread_only=1`

**GET response:**
```json
{
  "ok": true,
  "notifications": [
    {
      "id": 42,
      "notification_type": "book_lesson_submitted",
      "title": "New Submission",
      "body": "Ahmed submitted Lesson 3",
      "url": "/teacher/students/12",
      "action_label": "Review",
      "priority": "high",
      "is_read": false,
      "read_at": null,
      "created_at": "2026-05-20 10:00:00",
      "student_id": 12,
      "submission_id": 7,
      "metadata_json": null
    }
  ],
  "unread_count": 3,
  "total": 24
}
```

**POST fields:**
- `action=mark_read` + `notification_id=42` — mark single notification read
- `action=mark_all` — mark all teacher notifications read

**POST response:** `{ "ok": true, "unread_count": 0 }`

**Implementation notes:**
- Requires `book_notifications_ensure_schema($pdo)` to guarantee all columns exist
- Query teacher by `(user_type='teacher' OR target_role='teacher') AND user_id=[teacher_id]`
- `channel_in_app = 1` filter (only show in-app notifications)
- Mark read: sets `read_at = COALESCE(read_at, NOW())` AND `is_read = 1`
- Uses `ai_teacher_id($pdo)` to get authenticated teacher ID (same as ai-tools pattern)

### 4.2 `settings.php`

```
GET  settings.php               → return all settings as key→value map
POST settings.php (FormData)    → update one setting
```

**GET response:**
```json
{
  "ok": true,
  "settings": {
    "enable_videos_page": "1",
    "show_videos_on_homepage": "0",
    "enable_articles_page": "1",
    "show_articles_on_homepage": "1",
    "academy_name": "Habiba Nabil Arabic Academy"
  }
}
```

**POST fields:** `setting_key` (string), `setting_value` (string)

**POST response:** `{ "ok": true, "key": "enable_videos_page", "value": "1" }`

**Implementation notes:**
- GET: `SELECT setting_key, setting_value FROM site_settings ORDER BY setting_key`
- POST: calls `update_setting($pdo, $key, $value)` after CSRF check
- Validates `setting_key` is non-empty and alphanumeric+underscore

### 4.3 `help-articles.php`

```
GET  help-articles.php                → list articles (with filters)
POST help-articles.php (JSON body)    → save/create article
POST help-articles.php (FormData)     → delete (action=delete, id=N)
```

**GET params:** `?status=published&category_id=2&q=search&featured=1`

**GET response:**
```json
{
  "ok": true,
  "articles": [
    {
      "id": 1,
      "category_id": 2,
      "category_title": "Getting Started",
      "slug": "how-to-submit-homework",
      "title": "How to Submit Homework",
      "content": "...",
      "visible_roles": "student,parent",
      "featured": true,
      "status": "published",
      "sort_order": 0,
      "created_at": "2026-05-20 10:00:00",
      "updated_at": "2026-05-20 10:00:00"
    }
  ],
  "total": 12
}
```

**POST JSON body (save):**
```json
{
  "id": 1,
  "category_id": 2,
  "title": "How to Submit Homework",
  "content": "Markdown content...",
  "visible_roles": "student,parent",
  "featured": true,
  "status": "published",
  "sort_order": 0
}
```

**POST response:** `{ "ok": true, "id": 1, "slug": "how-to-submit-homework" }`

**Implementation notes:**
- Calls `help_ensure_schema($pdo)` first
- GET: calls `help_list_articles($pdo, $filters)`, joins `help_categories` for `category_title`
- POST JSON: calls `help_save_article($pdo, $data, $id)`
- DELETE: `DELETE FROM help_articles WHERE id = ?` after CSRF

### 4.4 `help-categories.php`

```
GET  help-categories.php              → list all categories
POST help-categories.php (JSON body)  → save/create category
```

**GET response:**
```json
{
  "ok": true,
  "categories": [
    {
      "id": 1,
      "slug": "getting-started",
      "title": "Getting Started",
      "icon": "BookOpen",
      "sort_order": 0,
      "roles": "student,teacher,parent",
      "active": true,
      "article_count": 4
    }
  ]
}
```

**POST JSON body:**
```json
{
  "id": null,
  "title": "Getting Started",
  "icon": "BookOpen",
  "sort_order": 0,
  "roles": "student,teacher,parent",
  "active": true
}
```

---

## 5. TypeScript Interfaces

```typescript
// notifications/types.ts
export interface TeacherNotification {
  id: number
  notification_type: string
  title: string
  body: string
  url: string
  action_label: string
  priority: 'low' | 'normal' | 'high'
  is_read: boolean
  read_at: string | null
  created_at: string
  student_id: number | null
  submission_id: number | null
  book_id: number | null
  metadata_json: string | null
}

export interface NotificationsListResponse {
  notifications: TeacherNotification[]
  unread_count: number
  total: number
}

// settings/types.ts
export type SiteSettings = Record<string, string>

export interface SettingsResponse {
  settings: SiteSettings
}

// help-center-cms/types.ts
export interface HelpCategory {
  id: number
  slug: string
  title: string
  icon: string
  sort_order: number
  roles: string        // CSV: 'student,teacher,parent'
  active: boolean
  article_count?: number
}

export interface HelpArticle {
  id: number
  category_id: number
  category_title?: string
  slug: string
  title: string
  content: string
  visible_roles: string  // CSV: 'student,teacher'
  featured: boolean
  status: 'published' | 'draft'
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HelpArticleSavePayload {
  id?: number
  category_id: number
  title: string
  content: string
  visible_roles: string
  featured: boolean
  status: 'published' | 'draft'
  sort_order: number
}
```

---

## 6. Frontend Feature Plan

### 6.1 `features/notifications/`

```
notifications/
├── index.ts
├── types.ts
├── api.ts                    ← getNotifications(params?), markRead(id), markAllRead()
├── components/
│   ├── NotificationBell.tsx  ← bell icon + red badge, opens drawer
│   ├── NotificationDrawer.tsx ← spring slide-in panel, list + mark-all button
│   └── NotificationItem.tsx  ← single row: icon by type, title, body, time, mark-read on click
├── hooks/
│   └── useNotifications.ts   ← useQuery refetchInterval: 30_000, unread_count from response
└── README.md
```

**Integration:** `TeacherLayout.tsx` header — add `<NotificationBell />` component next to existing header items.

**API calls:**
```typescript
getNotifications(params?: { unread_only?: boolean; limit?: number; offset?: number })
  → GET /api/teacher/notifications.php?unread_only=1&limit=20&offset=0

markRead(notificationId: number)
  → POST /api/teacher/notifications.php (FormData: action=mark_read, notification_id=N)

markAllRead()
  → POST /api/teacher/notifications.php (FormData: action=mark_all)
```

### 6.2 `features/settings/`

```
settings/
├── index.ts
├── types.ts
├── api.ts                   ← getSettings(), updateSetting(key, value)
├── SettingsPage.tsx         ← page at /teacher/settings
├── components/
│   ├── SettingsGroup.tsx    ← card with grouped settings rows
│   └── SettingToggle.tsx    ← individual boolean setting (toggle switch)
├── hooks/
│   └── useSettings.ts       ← useQuery + useMutation with optimistic toggle
└── README.md
```

**Route:** `<Route path="settings" element={<SettingsPage />} />`

**Settings groups to display:**
- Content: `enable_videos_page`, `show_videos_on_homepage`, `enable_articles_page`, `show_articles_on_homepage`
- (Any other settings loaded from DB are shown as generic key-value rows)

**Pattern:** Optimistic update — toggle fires mutation immediately, reverts on error via `onError` + `queryClient.setQueryData`.

### 6.3 `features/help-center-cms/`

```
help-center-cms/
├── index.ts
├── types.ts
├── api.ts                    ← getArticles(filters?), saveArticle(payload), deleteArticle(id), getCategories(), saveCategory(payload)
├── HelpCenterCmsPage.tsx     ← page at /teacher/help-center, two-panel: categories sidebar + articles list
├── components/
│   ├── ArticleList.tsx       ← table rows: title, category, status badge, featured star, edit/delete actions
│   ├── ArticleEditorDrawer.tsx ← slide-in drawer with full form (split-drawer pattern)
│   ├── ArticleForm.tsx       ← title, content (textarea), category select, visible_roles checkboxes, status, featured, sort
│   ├── CategoryList.tsx      ← list of categories with edit button
│   └── CategoryEditorDrawer.tsx ← slim drawer: title, icon, roles, active toggle
├── hooks/
│   └── useHelpCms.ts         ← queries for both articles and categories
└── README.md
```

**Route:** `<Route path="help-center" element={<HelpCenterCmsPage />} />`

**Key UX decisions:**
- Content field: `<textarea>` (plain markdown-ish, no rich text editor — keeps component under 200 lines)
- Delete: confirm before calling `deleteArticle(id)` via `window.confirm`
- Visible roles: multi-select checkboxes (student / teacher / parent / owner)

---

## 7. Wiring Changes

### `roles/teacher/index.tsx`
Add three routes:
```tsx
import { NotificationsPage } from './features/notifications'
import { SettingsPage } from './features/settings'
import { HelpCenterCmsPage } from './features/help-center-cms'

// Inside Routes:
<Route path="notifications" element={<NotificationsPage />} />
<Route path="settings" element={<SettingsPage />} />
<Route path="help-center" element={<HelpCenterCmsPage />} />
```

### `TeacherLayout.tsx` (or equivalent header component)
Add `<NotificationBell />` to the header bar.

---

## 8. Key Implementation Patterns

| Concern | Pattern |
|---|---|
| Auth | `ai_teacher_id($pdo)` from `../../lib/lib/ai-helpers.php` |
| CSRF | `csrf_check()` on all POST form endpoints |
| Schema init | `book_notifications_ensure_schema($pdo)` guarantees all `push_notifications` columns |
| Notification query | `WHERE (user_type='teacher' OR target_role='teacher') AND user_id=? AND channel_in_app=1` |
| Mark read | `SET read_at = COALESCE(read_at, NOW()), is_read = 1` |
| Settings GET | Raw `SELECT setting_key, setting_value FROM site_settings` → `array_column()` keyed map |
| Settings POST | `update_setting($pdo, $key, $value)` — validates key format `[a-z0-9_]+` |
| Help save | `help_save_article($pdo, $data, $id)` — auto-slugifies, handles create vs update |
| Refetch | Notifications: `refetchInterval: 30_000` (30s polling) |
| Optimistic | Settings toggles: optimistic update + rollback on error |
| Path prefix | `../../lib/lib/` and `../../config/config/` (double-nested, same as all teacher endpoints) |

---

## 9. File Count Summary

**Backend (4 new files):**
- `backend/api/teacher/notifications.php`
- `backend/api/teacher/settings.php`
- `backend/api/teacher/help-articles.php`
- `backend/api/teacher/help-categories.php`

**Frontend (notifications — 6 files):**
- `features/notifications/index.ts`
- `features/notifications/types.ts`
- `features/notifications/api.ts`
- `features/notifications/components/NotificationBell.tsx`
- `features/notifications/components/NotificationDrawer.tsx`
- `features/notifications/components/NotificationItem.tsx`
- `features/notifications/hooks/useNotifications.ts`
- `features/notifications/README.md`

**Frontend (settings — 6 files):**
- `features/settings/index.ts`
- `features/settings/types.ts`
- `features/settings/api.ts`
- `features/settings/SettingsPage.tsx`
- `features/settings/components/SettingsGroup.tsx`
- `features/settings/components/SettingToggle.tsx`
- `features/settings/hooks/useSettings.ts`
- `features/settings/README.md`

**Frontend (help-center-cms — 10 files):**
- `features/help-center-cms/index.ts`
- `features/help-center-cms/types.ts`
- `features/help-center-cms/api.ts`
- `features/help-center-cms/HelpCenterCmsPage.tsx`
- `features/help-center-cms/components/ArticleList.tsx`
- `features/help-center-cms/components/ArticleEditorDrawer.tsx`
- `features/help-center-cms/components/ArticleForm.tsx`
- `features/help-center-cms/components/CategoryList.tsx`
- `features/help-center-cms/components/CategoryEditorDrawer.tsx`
- `features/help-center-cms/hooks/useHelpCms.ts`
- `features/help-center-cms/README.md`

**Total: 4 backend + ~30 frontend files**
