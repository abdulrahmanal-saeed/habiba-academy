# Sprint 6.2 Analysis — Owner Portal: Settings + Articles + Videos

## Source files read

| Source | Location |
|---|---|
| Settings page | `New/Owner/Settings Center/teacher/settings.php` |
| Articles page | `New/Owner/Articles management/teacher/articles.php` |
| Videos page | `New/Owner/Videos management/teacher/videos.php` |
| Articles lib | `New/Core/lib/articles.php` |
| Videos lib | `New/Core/lib/videos.php` |
| Settings lib | `New/Core/lib/settings.php` |
| articles-save.php | `New/Core/api/teacher/articles-save.php` |
| articles-delete.php | `New/Core/api/teacher/articles-delete.php` |
| articles-toggle.php | `New/Core/api/teacher/articles-toggle.php` |
| videos-save.php | `New/Core/api/teacher/videos-save.php` |
| videos-delete.php | `New/Core/api/teacher/videos-delete.php` |
| videos-toggle.php | `New/Core/api/teacher/videos-toggle.php` |

---

## Auth

Same as Sprint 6.1 — `require_teacher()` / `$_SESSION['teacher_logged']`.  
**Path prefix** for `backend/api/owner/*.php`: `../../lib/lib/`, `../../config/config/db.php`

---

## DB Tables

### `articles`

```sql
id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
title           VARCHAR(255) NOT NULL
slug            VARCHAR(255) NOT NULL UNIQUE
excerpt         TEXT NULL
body            MEDIUMTEXT NULL
cover_image     VARCHAR(500) NULL  -- relative path: "uploads/articles/article_xxx.jpg"
status          ENUM('published','draft') DEFAULT 'draft'
show_on_homepage TINYINT(1) DEFAULT 0
sort_order      INT DEFAULT 0
meta_title      VARCHAR(255) NULL
meta_description VARCHAR(255) NULL
created_at      DATETIME
updated_at      DATETIME
```

Created by: `ensure_articles_table($pdo)`  
Also seeds `enable_articles_page='0'` and `show_articles_on_homepage='0'` into site_settings.

### `videos`

```sql
id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
title              VARCHAR(255) NOT NULL
slug               VARCHAR(255) NOT NULL UNIQUE
youtube_url        VARCHAR(500) NOT NULL
youtube_video_id   VARCHAR(32) NOT NULL   -- 11-char YouTube ID
youtube_embed_url  VARCHAR(500) NOT NULL  -- https://www.youtube.com/embed/{id}
short_description  TEXT NULL
thumbnail_url      VARCHAR(500) NOT NULL  -- https://img.youtube.com/vi/{id}/hqdefault.jpg
status             ENUM('published','draft') DEFAULT 'draft'
show_on_homepage   TINYINT(1) DEFAULT 0
sort_order         INT DEFAULT 0
created_at         DATETIME
updated_at         DATETIME
```

Created by: `ensure_videos_table($pdo)`  
Also seeds `enable_videos_page='0'` and `show_videos_on_homepage='0'` into site_settings.

### `site_settings` (or `settings`)

Auto-discovered by `settings_table_name($pdo)`.  
Feature flag keys managed in Sprint 6.2:

| Key | Default | Label |
|---|---|---|
| `enable_videos_page` | `0` | Enable Videos Page |
| `show_videos_on_homepage` | `0` | Show Videos on Homepage |
| `enable_articles_page` | `0` | Enable Articles Page |
| `show_articles_on_homepage` | `0` | Show Articles on Homepage |

Profile/social keys:

| Key | Default |
|---|---|
| `contact_whatsapp` | `971509298326` |
| `social_instagram` | `https://www.instagram.com/habibanabil` |
| `social_facebook` | `` |
| `social_youtube` | `` |
| `social_tiktok` | `` |
| `teacher_photo_v` | `1` |

Settings lib helpers:
- `settings_table_name($pdo)` — auto-discovers `site_settings` or `settings`, creates `site_settings` if neither exists
- `get_setting(key, default)` — reads with request-level static cache
- `update_setting(key, value)` — UPSERT, returns bool
- `setting_enabled(key, default)` — shortcut for `(string)get_setting() === '1'`

---

## Library Functions Reference

### Articles lib (`../../lib/lib/articles.php`)

| Function | Purpose |
|---|---|
| `ensure_articles_table($pdo)` | Idempotent table + flag creation |
| `article_unique_slug($pdo, $candidate, $excludeId)` | Collision-safe slug from text |
| `save_article_cover(array $file)` | Upload to `uploads/articles/`, returns relative path |
| `delete_article_cover_file(?string $path)` | Deletes old cover from disk |
| `fetch_article_by_id($pdo, $id)` | Single article row |
| `article_slugify($text)` | Text → URL-safe slug (Unicode-aware) |

Cover upload: max 2 MB, MIME must be `image/jpeg` / `image/png` / `image/webp`.  
Cover stored at: `uploads/articles/article_{timestamp}_{hex}.{ext}`

### Videos lib (`../../lib/lib/videos.php`)

| Function | Purpose |
|---|---|
| `ensure_videos_table($pdo)` | Idempotent table + flag creation |
| `video_unique_slug($pdo, $candidate, $excludeId)` | Collision-safe slug |
| `extract_youtube_video_id(string $url)` | Validates + extracts 11-char video ID from youtube.com/watch, youtu.be, or embed URLs |
| `youtube_embed_url(string $id)` | `https://www.youtube.com/embed/{id}` |
| `youtube_thumbnail_url(string $id)` | `https://img.youtube.com/vi/{id}/hqdefault.jpg` |
| `fetch_video_by_id($pdo, $id)` | Single video row |
| `video_slugify($text)` | Text → URL-safe slug |

---

## Backend Endpoints to Build (3 files)

### `backend/api/owner/settings.php`

**GET** → returns current values of all managed settings

```php
// Response
{
  "flags": {
    "enable_videos_page": bool,
    "show_videos_on_homepage": bool,
    "enable_articles_page": bool,
    "show_articles_on_homepage": bool
  },
  "profile": {
    "contact_whatsapp": string,
    "social_instagram": string,
    "social_facebook": string,
    "social_youtube": string,
    "social_tiktok": string,
    "teacher_photo_v": string
  }
}
```

**POST JSON** `action=update_flags` → update the 4 content feature toggles

```json
{ "action": "update_flags", "enable_videos_page": true, "show_videos_on_homepage": false, ... }
```

**POST FormData** `action=update_profile` → update WhatsApp + social links + optional photo upload

```
action=update_profile
contact_whatsapp (string, digits only)
social_instagram | social_facebook | social_youtube | social_tiktok (strings)
teacher_photo (file, optional, image/jpeg|png|webp)
```

Photo upload: saves to `../../assets/img/habiba.jpg`, bumps `teacher_photo_v` to `time()`.

---

### `backend/api/owner/articles.php`

**GET** → list all articles (both statuses, admin view)

```php
// Response
{ "articles": Article[] }
```

**POST FormData** `action=save` → create or update article

```
action=save
id (int, 0 = new)
title (required)
slug
excerpt
body (required)
cover_image (file, optional)
existing_cover_image (string, current cover path if editing)
status (published|draft)
show_on_homepage (1|0)
sort_order (int)
meta_title
meta_description
```

Response: `{ "id": int, "slug": string, "message": string }`

**POST FormData** `action=delete` → delete article + cover file

```
action=delete
id (int)
```

**POST FormData** `action=toggle` → toggle published↔draft

```
action=toggle
id (int)
```

Response: `{ "status": string, "status_label": string }`

Calls: `ensure_articles_table($pdo)`, `article_unique_slug()`, `save_article_cover()`, `delete_article_cover_file()`, `fetch_article_by_id()`.

---

### `backend/api/owner/videos.php`

**GET** → list all videos (both statuses, admin view)

```php
// Response
{ "videos": Video[] }
```

**POST FormData** `action=save` → create or update video

```
action=save
id (int, 0 = new)
title (required)
slug
youtube_url (required, validated by extract_youtube_video_id)
short_description
status (published|draft)
show_on_homepage (1|0)
sort_order (int)
```

Response: `{ "id": int, "slug": string, "message": string }`  
Backend auto-computes: `youtube_video_id`, `youtube_embed_url`, `thumbnail_url`.

**POST FormData** `action=delete`

```
action=delete
id (int)
```

**POST FormData** `action=toggle` → toggle published↔draft

---

## TypeScript Interfaces

```typescript
// features/settings/types.ts
export interface FeatureFlags {
  enable_videos_page: boolean
  show_videos_on_homepage: boolean
  enable_articles_page: boolean
  show_articles_on_homepage: boolean
}

export interface ProfileSettings {
  contact_whatsapp: string
  social_instagram: string
  social_facebook: string
  social_youtube: string
  social_tiktok: string
  teacher_photo_v: string
}

export interface OwnerSettings {
  flags: FeatureFlags
  profile: ProfileSettings
}

export type FlagKey = keyof FeatureFlags

export const FLAG_LABELS: Record<FlagKey, { label: string; desc: string }> = {
  enable_videos_page:        { label: 'Enable Videos Page',        desc: 'Show the Videos link publicly and allow /videos access.' },
  show_videos_on_homepage:   { label: 'Show Videos on Homepage',   desc: 'Render the Videos section on the landing page.' },
  enable_articles_page:      { label: 'Enable Articles Page',      desc: 'Show the Articles link publicly and allow /articles access.' },
  show_articles_on_homepage: { label: 'Show Articles on Homepage', desc: 'Render the Articles section on the landing page.' },
}

// features/articles/types.ts
export type ArticleStatus = 'published' | 'draft'

export interface Article {
  id: number
  title: string
  slug: string
  excerpt: string
  body: string
  cover_image: string | null
  status: ArticleStatus
  show_on_homepage: boolean
  sort_order: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export interface ArticleSavePayload {
  id?: number
  title: string
  slug: string
  excerpt: string
  body: string
  status: ArticleStatus
  show_on_homepage: boolean
  sort_order: number
  meta_title: string
  meta_description: string
  existing_cover_image: string
}

export interface ArticleListResponse {
  ok: boolean
  data: { articles: Article[] }
}

export interface ArticleActionResponse {
  ok: boolean
  data: { id?: number; slug?: string; status?: ArticleStatus; status_label?: string; message?: string }
}

// features/videos/types.ts
export type VideoStatus = 'published' | 'draft'

export interface Video {
  id: number
  title: string
  slug: string
  youtube_url: string
  youtube_video_id: string
  youtube_embed_url: string
  short_description: string
  thumbnail_url: string
  status: VideoStatus
  show_on_homepage: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface VideoSavePayload {
  id?: number
  title: string
  slug: string
  youtube_url: string
  short_description: string
  status: VideoStatus
  show_on_homepage: boolean
  sort_order: number
}

export interface VideoListResponse {
  ok: boolean
  data: { videos: Video[] }
}

export interface VideoActionResponse {
  ok: boolean
  data: { id?: number; slug?: string; status?: VideoStatus; status_label?: string; message?: string }
}
```

---

## Frontend Feature Plan

### Feature: `features/settings/` (Sprint 6.2)

```
settings/
  index.ts
  OwnerSettingsPage.tsx           three sections stacked
  types.ts
  api.ts                          getSettings(), updateFlags(), updateProfile()
  hooks/useOwnerSettings.ts       useQuery + 2 useMutations
  components/
    ContentFlagsSection.tsx       4 animated toggles (same pattern as teacher SettingsPage)
    ProfileSection.tsx            photo upload + WhatsApp input
    SocialLinksSection.tsx        4 URL inputs (Instagram, Facebook, YouTube, TikTok)
    SettingToggle.tsx             reuse same animated toggle pattern from Sprint 5.8
  README.md
```

- `updateFlags` — POST JSON action=`update_flags` → optimistic: immediate setQueryData, rollback on error
- `updateProfile` — POST FormData action=`update_profile` (photo = optional file)
- Photo preview: FileReader API on input change, live preview before submit
- `SettingToggle` is identical to teacher version — can be inlined (no shared/ yet for this)
- staleTime: 60_000

---

### Feature: `features/articles/` (Sprint 6.2)

```
articles/
  index.ts
  ArticlesPage.tsx               list + drawer wired
  types.ts
  api.ts                         getArticles(), saveArticle(), deleteArticle(), toggleArticle()
  hooks/useArticles.ts           useQuery + 3 useMutations
  components/
    ArticlesTable.tsx            table: cover thumb, title/slug, status, homepage, sort, edit/delete
    ArticleEditorDrawer.tsx      split-drawer: <Inner key={article?.id ?? 'new'} />
    ArticleForm.tsx              all form fields incl. cover upload
    ArticleStatusBadge.tsx       published=accent, draft=muted
  README.md
```

- **Cover upload**: `ArticleForm` uses `<input type="file" accept="image/jpeg,image/png,image/webp">`; if editing and existing cover → show preview from `/` + `cover_image` path
- **save** uses `postForm` (FormData — file upload)
- **delete** + **toggle** use `postForm` (simple FormData: action + id)
- Optimistic toggle: `onMutate` → setQueryData flip status, `onError` → rollback
- `window.confirm` before delete
- staleTime: 30_000

---

### Feature: `features/videos/` (Sprint 6.2)

```
videos/
  index.ts
  VideosPage.tsx                 list + drawer wired
  types.ts
  api.ts                         getVideos(), saveVideo(), deleteVideo(), toggleVideo()
  hooks/useVideos.ts             useQuery + 3 useMutations
  components/
    VideosTable.tsx              table: YouTube thumb, title/slug, status, homepage, sort, edit/delete
    VideoEditorDrawer.tsx        split-drawer: <Inner key={video?.id ?? 'new'} />
    VideoForm.tsx                title, slug, youtube_url + live preview, description, status, sort
    YoutubePreview.tsx           extracts ID from URL, shows thumbnail + embed URL
    VideoStatusBadge.tsx         published=accent, draft=muted (or share ArticleStatusBadge as ContentStatusBadge)
  README.md
```

- **YouTube ID extraction** in frontend: same logic as source JS — parse URL, extract 11-char ID
- **live preview**: `YoutubePreview` component renders `img.youtube.com/vi/{id}/hqdefault.jpg` as ID changes
- **save** uses `postForm` (no file, but simple FormData for consistency with toggle/delete)
- Optimistic toggle same pattern
- `window.confirm` before delete
- staleTime: 30_000

---

### Wiring changes (`roles/owner/index.tsx`)

Add three routes:
```tsx
<Route path="settings"  element={<OwnerSettingsPage />} />
<Route path="articles"  element={<ArticlesPage />} />
<Route path="videos"    element={<VideosPage />} />
```

OwnerSidebar already has nav items for articles, videos, settings — no sidebar changes needed.

---

## File Count Estimate

| Layer | Count |
|---|---|
| Backend PHP | 3 |
| Settings feature | ~9 |
| Articles feature | ~11 |
| Videos feature | ~12 |
| index.tsx update | 1 |
| **Total** | **~36 files** |

---

## Patterns to reuse

- **Split-drawer key-remount**: `<Inner key={item?.id ?? 'new'} />`
- **Optimistic status toggle**: `onMutate` → flip status in cache, `onError` → rollback to snapshot
- **postForm** for all article/video mutations (FormData: action=save|delete|toggle)
- **post** (JSON) for settings flags update
- **drawerVariant** + **modalBackdrop** for drawers
- **stagger** + **cardVariant** for table rows
- `var(--accent)` teal only, no hardcoded hex
- `article_slugify` logic mirrors frontend: lowercase + replace non-alphanumeric with `-`
- Teacher SettingsPage `SettingToggle` pattern is identical — reimplement inline in owner features

## Important notes

- Articles have **file upload** (cover_image) → use `postForm` with actual `FormData` including the `File` object
- Videos have **no file upload** → thumbnails auto-generated from YouTube ID; save still uses `postForm` for consistent action dispatch
- Settings photo upload (`update_profile`) must use `postForm` with a `File` object in FormData
- The `/assets/img/habiba.jpg` file is on the server — photo upload replaces it in-place
- `teacher_photo_v` is a cache-busting version string (timestamp) returned in GET settings response
