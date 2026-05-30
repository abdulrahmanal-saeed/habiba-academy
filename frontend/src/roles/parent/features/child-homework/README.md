# Child Homework — Parent Role

## What it does
Shows a parent the homework list for a specific child: title, date, and submission status (Submitted / Awaiting).

## Roles
Parent only (`/parent/children/:id/homework`)

## Components
| Component | Purpose |
|-----------|---------|
| `HomeworkStatusBadge` | Green "مسلَّم" or amber "بانتظار التسليم" badge |
| `HomeworkList` | Animated staggered list of homework rows |
| `ChildHomeworkPage` | Root page — reads `:id` from URL, fetches + renders |

## API
- `GET /api/parent/child-homework?id=N` → `ChildHomeworkData`
  - Returns 403 if student is not linked to this parent

## Known limitations
- Read-only — parents cannot submit homework
- Limited to last 30 items from API
