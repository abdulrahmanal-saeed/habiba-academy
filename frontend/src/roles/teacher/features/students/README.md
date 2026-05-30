# Teacher Students

List of all students with lesson balance details.

## Endpoint
`GET /api/teacher/students.php`

Returns: `{ students: TeacherStudent[] }`

## Components
- `StudentFilters` — live search + active/inactive tabs
- `StudentCard` — avatar, login_code, level, last_seen, balance panel

## Notes
- All students loaded at once; filtering is client-side
- `last_seen` formatted as "Today, 3:45 PM" / "Yesterday" / date string
- Balance is `null` if no package assigned
