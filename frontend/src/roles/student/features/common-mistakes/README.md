# Student Common Mistakes Feature

Lists recurring mistake patterns the teacher has logged. Each card shows the mistake type with guidance and a "Got it" toggle.

## Role
Student only.

## Components
- `MistakeCard` — `guidance.title_en` (NOT raw `tag`) + optional note + collapsible guidance accordion + fixed toggle

## API Endpoints
- `GET /api/student/common-mistakes.php` — all active mistakes for the student (newest first)
- `POST /api/student/toggle-mistake.php` — toggle `is_mastered`; returns `{ ok: true }` only (no is_mastered echo)

## Key Business Rules
- Display title = `guidance.title_en` — raw `tag` is an internal key, never shown directly
- 6 known mistake categories mapped to human-readable titles; unknown tags fall back to raw tag text
- Toggle returns `{ ok: true }` only — derive new state from flip of current local state
- Mastered label is "Fixed ✓" (NOT "Mastered ✓" — different from Weak Words)
- Same optimistic toggle pattern as WeakWordCard but without server confirmation of new value
- Guidance: show `meaning_en`, `example_en`, `student_action_en` ONLY
- Do NOT show `teacher_action_en/ar` to students
- Empty state: 🎉 emoji + "No common mistakes recorded yet."

## Known Limitations
- No search/filter (teacher-curated list)
