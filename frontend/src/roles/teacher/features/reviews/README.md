# Reviews — Teacher Feature

Teacher-side review management: create, edit, grade, and delete student reviews.

## Components

- `StudentReviewsTab` — root tab component (list + drawers)
- `ReviewList` — list with "New Review" button and pending count
- `ReviewRow` — single row: title, type badge, date, status, score, actions
- `ReviewCreateDrawer` — create/edit drawer with schema builder
- `SchemaBuilder` — add/remove sections (MCQ, Writing, Speaking, etc.)
- `MCQSectionForm` — multiple choice questions editor
- `WritingSectionForm` — writing prompts + criteria editor
- `SpeakingSectionForm` — speaking prompts + criteria editor
- `GradeDrawer` — grade a pending submission (verdict or partial score per item)

## API

- `GET /api/review/student-list.php?student_id=X`
- `POST /api/review/create.php`
- `POST /api/review/update.php` (blocked if submission exists)
- `POST /api/review/save.php` (grade submission)
- `POST /api/review/delete.php` (blocked if submission exists, uses `review_id`)
- `POST /api/teacher/review-delete.php` (force delete + audio cascade, uses `id`)
- `GET /api/teacher/review-submission.php?submission_id=X`

## Key Rules

- `scores_json` and `overrides_json` must be `JSON.stringify()` strings
- `publish_time` required when `status=published`
- `teacher_verdict='correct'` → score=max_points; `'wrong'` → score=0; null → partial
- Section IDs must be exact lowercase: `mcq`, `matching`, `fill_the_blank`, `writing`, `speaking`, `scenario`
