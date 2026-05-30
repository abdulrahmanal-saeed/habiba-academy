# Teacher Book Submissions Feature

Allows the teacher to review interactive book lesson submissions and send written/speaking feedback.

## Endpoints

- `GET /api/teacher/book-submissions.php?status=...&q=...` — list submissions
- `GET /api/teacher/book-submission-detail.php?submission_id=X` — single submission detail
- `POST /api/teacher/book-post-feedback.php` — save and send feedback

## Key Rules

- `answers_json` is a LONGTEXT JSON blob parsed server-side via `interactive_books_submission_answers()`
- Both `writing_task` (singular) and `writing_tasks` (plural) exist — handle both
- `teacher_score` and `speaking_score` sent as strings — backend converts to float or NULL
- Feedback is DELETE + INSERT in `book_feedback` (not upsert)
- Status becomes `feedback_sent` after teacher submits
