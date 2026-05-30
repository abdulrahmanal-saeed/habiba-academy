# Interactive Book — Shared Feature

## What it does
Shared infrastructure for the Arabic for Daily Life interactive book. Used by Student (read + submit), Teacher (review + feedback), and Parent (read-only view). Contains all TypeScript types, custom hooks, and base reusable components.

## Roles
| Role | Pages |
|------|-------|
| Student | Book list, Book view (TOC), Lesson page, Feedback page |
| Teacher | Submissions list, Submission review + feedback form |
| Parent | Book list, Book view (TOC), Lesson read-only |

## Sprint structure
- **Sprint 10.1** (this folder) — Types, hooks, base components ← CURRENT
- **Sprint 10.2** — Student: BookListPage, BookViewPage, LessonHeader, static sections
- **Sprint 10.3** — Student: All 30+ exercise section components
- **Sprint 10.4** — Student: WritingBlock usage, SpeakingBlock usage, SelfCheck, SubmitBlock, FeedbackPage
- **Sprint 10.5** — Teacher: SubmissionsPage, SubmissionReviewPage, FeedbackForm
- **Sprint 10.6** — Backend PHP: 12 endpoints + 2 lib ports + 15 lesson content PHP files
- **Sprint 10.7** — Routes wiring + final TSC/ESLint clean

## Architecture

### Central answer state (`useBookAnswers`)
`LessonPage` creates `useBookAnswers(initialAnswers)` and passes slices to each section via props. Sections call `setExercise(type, questionId, value)`, `setWritingTask(value)`, `setSpeakingTask(key, url, duration)`, etc. On submit, `getFormData(lessonId)` builds the full `FormData` object.

### Generic components
- `ChoiceBlock` — handles all **14 radio-group** exercise types (mcq, color_recognition, etc.)
- `MatchingBlock` — handles all **10 dropdown-match** types (matching, job_matching, etc.)

Both take a `questionType: string` prop so the parent knows which `setExercise` key to use.

### Speaking upload flow
1. Student clicks "Start Recording" → `useMediaRecorder` calls `getUserMedia`
2. Student clicks "Stop" → blob is uploaded immediately via `POST /api/student/book-audio-upload.php`
3. Server returns `{ audio_url, duration_seconds }` → `onRecorded` callback updates `useBookAnswers`
4. Audio URL is stored in answers state; form submit validates it is non-empty

### Form submission
`FormData` (not JSON) — the PHP backend reads raw `$_POST` and validates server-side. The `apiClient.postForm` utility injects the CSRF token automatically.

## Components
| Component | Purpose |
|-----------|---------|
| `ChoiceBlock` | Generic radio-group (14 exercise types) |
| `MatchingBlock` | Generic dropdown-match (10 exercise types) |
| `WritingBlock` | Arabic textarea with sentence count hint |
| `SpeakingBlock` | MediaRecorder UI with Framer Motion state transitions |
| `MediaPlayer` | YouTube iframe OR `<audio>`/`<video>` auto-detected |

## Hooks
| Hook | Purpose |
|------|---------|
| `useBookAnswers` | Central answers state + `getFormData()` builder |
| `useMediaRecorder` | Browser MediaRecorder + immediate audio upload |

## API endpoints (Sprint 10.6)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/student/book-list.php` | Student book list |
| GET | `/api/student/book-view.php` | Book + lessons + TOC |
| GET | `/api/student/book-lesson.php` | Lesson + content + submission |
| GET | `/api/student/book-feedback.php` | Feedback page data |
| POST | `/api/student/book-save-draft.php` | Save in-progress answers |
| POST | `/api/student/book-submit-lesson.php` | Final submission |
| POST | `/api/student/book-audio-upload.php` | Speaking audio upload |
| POST | `/api/student/book-audio-activity.php` | Track audio plays |
| POST | `/api/student/book-add-weak-word.php` | Add vocab to weak words |
| GET | `/api/teacher/book-submissions.php` | Submissions list |
| GET | `/api/teacher/book-submission.php` | Submission detail |
| POST | `/api/teacher/book-post-feedback.php` | Send feedback to student |
