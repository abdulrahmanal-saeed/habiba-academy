# Owner Articles

Full CRUD management for public-facing articles, with cover image upload and status toggling.

## Role
Owner only (`/owner/articles`)

## Components
- `ArticlesPage` — list + new button + drawer wired
- `ArticlesTable` — card list: cover thumb, title/slug, status badge, toggle/edit/delete
- `ArticleEditorDrawer` — split-drawer key-remount: `<Inner key={article?.id ?? 'new'} />`
- `ArticleForm` — all fields: cover upload, title, slug, excerpt, body, status, sort, meta
- `ArticleStatusBadge` — published=accent, draft=muted

## API
- `GET /api/owner/articles` → articles array (all statuses)
- `POST /api/owner/articles` FormData action=`save|delete|toggle`

## Key patterns
- Cover upload: FileReader preview + FormData `cover_image` File
- Optimistic toggle: flip status in cache, rollback on error
- `window.confirm` before delete
- Split-drawer key-remount resets form state without useEffect
