# Articles Feature

Public blog/articles for Arabic language learning tips.

## Pages

- `/articles` — Paginated list with cover images, category badges, reading time
- `/articles/:slug` — Full article with body HTML, inline CTA

## API

```
GET /api/public/articles?page=1&category=...
  Response: { ok: true, items: Article[], total, page, totalPages }

GET /api/public/articles/:slug
  Response: { ok: true, item: Article }
```

## Notes

- `article.body` is trusted HTML from the CMS — rendered via `dangerouslySetInnerHTML`
- The backend must sanitize HTML before storing (no XSS from raw user input)
- Each article page ends with a CTA → level test
