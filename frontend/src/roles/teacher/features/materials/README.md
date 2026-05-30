# Teacher Materials Feature

Allows the teacher to assign course materials (files or URLs) to individual students.

## Endpoints

- `GET /api/teacher/student-materials.php?student_id=X` — list materials for student
- `POST /api/teacher/materials-save.php` — create or update material (multipart/form-data)
- `POST /api/teacher/materials-delete.php` — delete or soft-archive material

## Key Rules

- Delete is soft-archived if `material_progress` has entries for that material
- File upload: max 80 MB, blocked: php/exe/js/sh/bat extensions
- URL auto-detected as `video_link` if it matches embed pattern
- `source_type=file` without a new file (on edit) keeps the existing file
