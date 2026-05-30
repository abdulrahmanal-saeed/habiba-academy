# Book Builder (Teacher)

Route: `/teacher/book-builder`

Two-panel layout: book/lesson list on the left, section editor on the right.

## Files

| File | Purpose |
|------|---------|
| `BookBuilderPage.tsx` | Main page — list + editor shell |
| `api.ts` | `getBooks`, `getLesson`, `saveLesson`, `deleteLesson`, `deleteBook` |
| `types.ts` | `BuilderBook`, `BuilderLesson`, `BuilderSection`, `SectionKind`, payloads |
| `components/BookBuilderList.tsx` | Left sidebar — books with per-lesson rows |
| `components/LessonBuilderForm.tsx` | Section list with add/remove/reorder (Framer Motion) |
| `components/SectionTypeSelector.tsx` | Modal grid — pick section kind |
| `components/sections/TitleForm.tsx` | EN + AR title inputs |
| `components/sections/PassageForm.tsx` | Reading passage (AR + optional EN) |
| `components/sections/MediaForm.tsx` | URL + label for audio / video / image |
| `components/sections/MCQForm.tsx` | Dynamic question list with 4 options + correct radio |
| `components/sections/MatchForm.tsx` | Dynamic left/right pair list |
| `components/sections/WritingForm.tsx` | Prompt AR/EN + min sentences |
| `components/sections/SpeakingForm.tsx` | Prompt AR/EN + time limit |

## Backend endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `book-builder-list.php` | GET | Books + lessons list |
| `book-builder-lesson.php` | GET `?lesson_id=N` | Lesson meta + content |
| `book-builder-save.php` | POST JSON | Create or update lesson + content_json |
| `book-builder-delete.php` | POST JSON | Delete lesson or book |

## Content format

Lesson content is stored in `book_lessons.content_json` as:
```json
{ "sections": [{ "id": "uuid", "kind": "mcq", "data": { ... } }] }
```

The `LessonBuilderForm` manages `BuilderSection[]`. On save, `BookBuilderPage` wraps it in `{ sections }` and sends via `saveLesson`.
