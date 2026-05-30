# Student Auth Feature

Login and logout for the student role (code-based authentication).

## Role
Student only.

## Components
- `StudentLoginPage` — single `login_code` input, waiting accordion, level test CTA

## API Endpoints
- `POST /api/student/login.php` — no CSRF required (pre-auth); returns `{ ok, student: { id, name, level } }`
- `GET /api/student/logout.php` — no CSRF required; clears session; returns `{ ok, message }`

## Key Business Rules
- Input auto-uppercased client-side; server also calls `strtoupper()`
- Rate limit: 5 attempts per IP per 15 minutes → HTTP 429 → axios throws → displayed as error
- Inactive account → "Your account is inactive. Please contact your teacher."
- On success: call `fetchCsrfToken()` to refresh CSRF for the new session, then `setAuth()`, then navigate to `/student`
- WhatsApp contact: `971509298326` (public, in source)

## Session Variables (set by PHP on login)
- `student_id`, `student_name`, `student_code`, `lt_existing_student_id`
