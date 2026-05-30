# Help Center (Public)

FAQ accordion page for public visitors, sourced from the shared help CMS.

## Route

- `/help` — Searchable accordion FAQ, grouped by category

## API

```
GET /api/help/articles?role=all&search=...
  Response: { ok: true, items: HelpArticle[] }
```

## Notes

- Uses shared `/api/help/articles` endpoint with `role=all` to fetch public articles
- Debounced search (350ms) to reduce API calls
- Accordion bodies rendered as trusted CMS HTML via `dangerouslySetInnerHTML`
- Owner manages content via `owner/features/help-cms`
