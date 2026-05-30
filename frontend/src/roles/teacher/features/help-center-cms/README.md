# Help Center CMS Feature

CMS for managing help articles and categories. Teacher has full CRUD access.

## Roles

Teacher (admin access)

## Components

- `HelpCenterCmsPage` — two-panel page at `/teacher/help-center`
- `ArticleList` — table of articles with edit/delete actions
- `ArticleEditorDrawer` — spring slide-in drawer for article create/edit (split-drawer pattern)
- `ArticleForm` — form with title, category, roles, status, featured, content
- `CategoryList` — sidebar list of categories with edit
- `CategoryEditorDrawer` — slim drawer for category create/edit

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `teacher/help-articles.php` | GET | List articles with filters |
| `teacher/help-articles.php` | POST (JSON) | Save/create article |
| `teacher/help-articles.php` | POST (form action=delete) | Delete article |
| `teacher/help-categories.php` | GET | List all categories |
| `teacher/help-categories.php` | POST (JSON) | Save/create category |

## Patterns

- Split-drawer: `ArticleEditorDrawer` wraps `Inner` with key=article.id to reset state on each open
- Delete: `window.confirm` before calling deleteArticle
- Visible roles: CSV string — `'student,teacher,parent'`
- Article content: plain textarea (markdown-style, no rich text editor)
