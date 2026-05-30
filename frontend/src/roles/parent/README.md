# Parent Role

## Overview
Read-only portal for parents to monitor their linked children's progress, homework, and upcoming sessions at the Habiba Nabil Arabic Academy.

## Auth
Session-based: `$_SESSION['parent_id']` — set during parent portal login. No `require_teacher()` — pure session check.

## Routes
| Path | Feature | Description |
|------|---------|-------------|
| `/parent` | Dashboard | Welcome + KPIs + student cards + upcoming sessions |
| `/parent/children/:id/homework` | Child Homework | Homework list with submission status |
| `/parent/children/:id/progress` | Child Progress | Session balance KPIs + progress bar |

## Features
| Feature | Folder |
|---------|--------|
| Dashboard | `features/dashboard/` |
| Child Homework | `features/child-homework/` |
| Child Progress | `features/child-progress/` |

## Key constraints
- `parent_require_child()` must be called on all child endpoints — prevents parents from accessing other students' data
- `portals_ensure_schema($pdo)` required on every API request
- Backend lib path: `../../lib/lib/helpers.php` (double-nested)
