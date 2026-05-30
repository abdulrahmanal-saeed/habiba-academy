# Student Weak Words Feature

Lists Arabic words the teacher has flagged for extra practice. Students can expand guidance and mark words as mastered.

## Role
Student only.

## Components
- `WeakWordCard` — word (RTL big text) + optional note + collapsible guidance accordion + mastered toggle

## API Endpoints
- `GET /api/student/weak-words.php` — all active words for the student (newest first)
- `POST /api/student/toggle-weak-word.php` — toggle `is_mastered` (bidirectional); returns `{ is_mastered: 0|1 }`

## Key Business Rules
- Only `is_active = 1` words shown
- Toggle is bidirectional — mastered words can be un-mastered
- Toggle uses `postForm(FormData)` — PHP reads `$_POST`; CSRF injected automatically by axios interceptor
- Mastered state: card opacity 0.65 + "Mastered ✓" badge + green button
- Guidance: show `meaning_en`, `practice_prompt_en`, `student_action_en` ONLY
- Do NOT show `teacher_action_en/ar` to students
- Optimistic toggle: flip local state immediately, confirm from API response, rollback on failure
- Empty state: 🎉 emoji + "No weak words assigned yet."

## Known Limitations
- No search/filter (list is typically short — teacher-curated)
