# Teacher Dashboard

Main landing page for the teacher after login.

## Endpoint
`GET /api/teacher/home.php?month=YYYY-MM`

Returns: `{ kpis, today_homework, today_scenarios, today_reviews, priority_queue, calendar }`

## Components
- `KpisRow` — 4 cards: active students, homeworks, scenarios, level tests
- `TodayActivity` — 3 tabs (homework/scenarios/reviews), close = set status to `closed`
- `PriorityQueue` — AI-generated priority list, dismiss = localStorage only
- `CalendarWidget` — month grid, dots on days with sessions, click day to see sessions

## Notes
- `priority_queue` dismiss is localStorage-only; server always returns all items on refresh
- Calendar month change triggers a new query via `queryKey: ['teacher-dashboard', month]`
