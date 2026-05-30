# Owner — Parents

Create parent accounts linked to one or more students via portals_sync_links.

## Routes
- `/owner/parents` — ParentsPage

## Backend
- `GET  /api/owner/parents` — list all parents with student_count + students GROUP_CONCAT
- `GET  /api/owner/parents?action=students` — student options for multi-select
- `POST /api/owner/parents` action=save — create parent (PR-NNNNNN access code)
- `POST /api/owner/parents` action=delete — soft delete (status=inactive)

## Key notes
- Access code format: PR-NNNNNN via portals_generate_access_code('PR')
- portals_sync_links: always send complete student_ids[] (DELETE + re-INSERT)
- Create-only (no edit by ID) — matches source PHP
- portals_ensure_schema() creates parent_contacts + parent_students tables
