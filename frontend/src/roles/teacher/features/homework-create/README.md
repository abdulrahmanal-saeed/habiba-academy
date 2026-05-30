# Homework Create Feature

Teacher form to create (or edit) homework for a student.

## Routes
- `/teacher/homework/create?student_id=X` → `HomeworkCreatePage` (pre-selects student)

## Sections (all optional except title + date)
- **Listening** — YouTube/audio URL + instructions
- **Reading** — Arabic/English passage (RTL auto-detect via `dir="auto"`)
- **MCQ** — Up to 10 questions; A/B required, C/D optional; correct option is radio select
- **Writing** — Up to 5 prompts; min_sentences + focus_area
- **Speaking** — Up to 5 prompts; time_limit_seconds + tips

## API
- POST `/api/teacher/create-homework.php` (multipart FormData + CSRF)
- POST `/api/teacher/update-homework.php` (same shape + `homework_id`)
- Sections sent as JSON strings: `mcq_questions=JSON.stringify([...])`

## Key Rules
- `publish_at` computed server-side from `hw_date + publish_time`
- Update blocked if any submission exists → 404 "already submitted"
- On success: navigate to `/teacher/students/:id?tab=submissions`
