# Shared Help Center

Role-aware help center component used across all authenticated portals (student, teacher, owner, parent, academy, media-buyer).

## Usage

```tsx
import { HelpCenter } from '@/shared/help-center'

<HelpCenter role="student" />
<HelpCenter role="teacher" title="مساعدة المعلم" />
```

## API

```
GET /api/help/categories?role=<role>
  Response: { ok: true, items: HelpCategory[] }

GET /api/help/articles?role=<role>&search=<query>&category=<slug>
  Response: { ok: true, articles: HelpArticle[], total: number }

GET /api/help/articles/:slug
  Response: { ok: true, item: HelpArticle }
```

## Props

| Prop | Type | Default |
|------|------|---------|
| role | string | required |
| title | string | 'مركز المساعدة' |
| subtitle | string | 'ابحث عن إجابات...' |

## Notes

- Search is debounced 300ms (HelpSearch component)
- Category filter and search are mutually exclusive (selecting one clears the other)
- Article body rendered via `dangerouslySetInnerHTML` — backend must sanitize
- `HelpArticleView` fetches the full article by slug on demand
- Owner manages content via `owner/features/help-cms`
