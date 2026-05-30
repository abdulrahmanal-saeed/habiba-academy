# Student Book Feature

Interactive book lessonss for students — lesson list, lesson view, exercises, speaking + writing tasks.

## Routes
- `/student/book` — BookListPage (grid of available books)
- `/student/book/:lessonId` — LessonPage (full lesson view + exercises + submit)

## Architecture
- `LessonPage` = data shell (fetches BookLessonData, handles loading/error)
- `LessonContent` = sub-component that owns `useBookAnswers` state
- `contentToSections(content)` converts flat LessonContent → ordered LessonSection[]
- `SectionRenderer` dispatches each section to the correct component

## API endpoints used
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/student/book-list.php` | GET | All books + progress |
| `/api/student/book-lesson.php?lesson_id=N` | GET | Lesson content + existing answers |
| `/api/student/book-save-draft.php` | POST (FormData) | Save draft |
| `/api/student/book-submit-lesson.php` | POST (FormData) | Submit lesson |
| `/api/student/book-audio-activity.php` | POST (FormData) | Track audio play (fire-and-forget) |
| `/api/student/book-add-weak-word.php` | POST (FormData) | Add vocab word to weak-words list |
