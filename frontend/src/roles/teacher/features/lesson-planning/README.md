# Lesson Planning Feature

Teacher view for managing a student's contract, session slots, and progress stats.

## Route
- `/teacher/students/:id/lesson-plan` → `LessonPlanningPage`

## Components
| Component | Purpose |
|-----------|---------|
| `ContractCard` | Contract summary + inline edit form; shows "Setup Contract" dashed button when no contract |
| `StatsCard` | SVG progress ring (pct) + stats grid + monthly income |
| `SkillBalanceBar` | Horizontal bars showing skill frequency from completed sessions |
| `SessionList` | Groups sessions: Upcoming / Completed / Other |
| `SessionRow` | Single session row with status badge, skills chips, milestone star |
| `SessionStatusMenu` | Dropdown for all 6 statuses; absent requires confirm dialog |
| `SessionEditDrawer` | Slide-up bottom sheet to edit session details + change status |

## API Endpoints
- GET `/api/teacher/lesson-plan-data.php?student_id=X`
- POST `/api/teacher/session-save.php` — update details (uses `id` field, not `session_id`)
- POST `/api/teacher/session-status.php` — update status (uses `id` field)
- POST `/api/teacher/contract-save.php` — create or update contract

## Key Rules
- Contract UPSERT: update never deletes sessions — only adds if total_sessions increased
- `absent` status: price halved to 50% + `is_paid=1` immediately — confirm dialog required
- `rescheduled` status: prompts for new date before submitting
- Skills sent as CSV string; backend normalizes via `lesson_normalize_skills_csv()`
- `est_finish` is null when < 2 completed sessions — show "—"
- `session_number` is stable display order — do not re-sequence
- `SessionEditDrawer` uses `key={session.id}` from parent + lazy `useState` init (no useEffect setState)
