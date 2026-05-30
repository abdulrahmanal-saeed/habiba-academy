# Owner — Book Launch Control

Manage book visibility, marketing toggles, and student activation requests.

## Routes
- `/owner/book-launch` — BookLaunchPage (KPIs + settings + readiness + audit)
- `/owner/book-launch/requests` — BookActivationRequestsPage

## Backend
- `GET  /api/owner/book-launch.php` — full BookLaunchData (settings, readiness, KPIs, audit_log)
- `GET  /api/owner/book-launch.php?sub=requests` — activation requests (filterable by status)
- `POST /api/owner/book-launch.php` action=launch|hide|pause — preset modes
- `POST /api/owner/book-launch.php` action=save — granular settings save
- `POST /api/owner/book-launch.php` action=approve_request|reject_request|needs_more_info

## Key notes
- 14 boolean toggles + 1 VisibilityStatus enum (hidden/teacher_preview_only/coming_soon/launched/paused)
- Readiness checklist: 11 DB-driven items + 6 hardcoded false items
- All settings changes are logged to book_launch_audit_log
- Pending request count is shown as a badge in the nav link
