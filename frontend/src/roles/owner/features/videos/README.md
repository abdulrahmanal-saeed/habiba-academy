# Owner Videos

YouTube video management with live URL preview, status toggling, and sort control.

## Role
Owner only (`/owner/videos`)

## Components
- `VideosPage` — list + new button + drawer wired
- `VideosTable` — card list: YouTube thumbnail, title/slug, status badge, toggle/edit/delete
- `VideoEditorDrawer` — split-drawer key-remount: `<Inner key={video?.id ?? 'new'} />`
- `VideoForm` — title, slug, YouTube URL, live YoutubePreview, description, status, sort
- `YoutubePreview` — extracts 11-char video ID from URL, shows CDN thumbnail
- `VideoStatusBadge` — published=accent, draft=muted

## API
- `GET /api/owner/videos` → videos array (all statuses)
- `POST /api/owner/videos` FormData action=`save|delete|toggle`

## Key patterns
- No file upload — thumbnails auto-generated from YouTube ID by backend
- `extractYoutubeId` handles youtube.com/watch, youtu.be, and embed URLs
- Optimistic toggle: flip status in cache, rollback on error
- `window.confirm` before delete
