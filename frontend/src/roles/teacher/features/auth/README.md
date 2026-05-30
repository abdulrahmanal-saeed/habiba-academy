# Teacher Auth

Password-based teacher login. Single teacher, no DB row.

## Endpoints
- `POST /api/teacher/login.php` — password field, CSRF, sets `$_SESSION['teacher_logged']`
- `GET /api/teacher/logout.php` — destroys session
- `GET /api/auth/me.php` — returns `{ id: 1, name: 'Teacher', role: 'teacher' }` when `teacher_logged` is set

## Components
- `TeacherLoginPage` — password input with show/hide toggle, Framer Motion fadeInUp

## Notes
- Password is read from `TEACHER_PASSWORD` env var on server (never exposed to frontend)
- After login: `fetchCsrfToken()` is called to refresh CSRF for the new session
