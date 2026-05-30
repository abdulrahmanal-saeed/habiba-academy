# Owner — Academies

Manage partner academies and their student access links.

## Routes
- `/owner/academies` — AcademiesPage

## Backend
- `GET  /api/owner/academies.php` — list all academies
- `GET  /api/owner/academies.php?action=students` — student options for multi-select
- `POST /api/owner/academies.php` action=save — create or update academy + sync student links
- `POST /api/owner/academies.php` action=delete — soft-delete (status=inactive)

## Key notes
- `portals_sync_links()` does DELETE + re-INSERT on every save — send the FULL `student_ids[]` list
- Access codes are generated with `portals_generate_access_code('ACAD')` on create
- Status values: `active` | `inactive`
