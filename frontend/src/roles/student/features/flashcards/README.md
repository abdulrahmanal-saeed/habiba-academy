# Student Flashcards Feature

Spaced-repetition card review session. Students work through due words and mistakes one at a time.

## Role
Student only.

## Components
- `FlashCard` — front/back/hint card with AnimatePresence reveal animation
- `ReviewButtons` — Got it / Almost / Missed rating buttons
- `DoneState` — empty state or session-complete message

## API Endpoints
- `GET /api/student/flashcards.php` — returns due cards (max 30 words + 30 mistakes)
- `POST /api/student/flashcard-review.php` — submits rating via `postForm` (PHP reads `$_POST`)

## Key Business Rules
- `got_it` → next review in 3 days, is_mastered=1
- `almost` → next review tomorrow
- `missed` → next review today
- Back or hint may be empty — render only what's present
- POST failure: show error, stay on same card, re-enable buttons (do NOT advance)
- `card_type: 'word'` → label "Practice Word" | `card_type: 'mistake'` → "Common Mistake"

## Known Limitations
- Cards are loaded once per session; rating a card does not remove it from the in-memory array
