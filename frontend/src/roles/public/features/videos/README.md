# Videos Feature

Free educational video library (public-facing).

## Pages

- `/videos` — Grid of video thumbnails with hover play overlay + duration badge
- `/videos/:slug` — Native HTML5 `<video>` player + description + CTA

## API

```
GET /api/public/videos
  Response: { ok: true, items: Video[] }

GET /api/public/videos/:slug
  Response: { ok: true, item: Video }
```
