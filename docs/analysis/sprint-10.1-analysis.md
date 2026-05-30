# Sprint 10.1 — Interactive Book + AI Tools Analysis

**Pattern 3: Breaking Down Large PHP Files**

Source files analysed:
- `New/Core/lib/interactive-books.php` (1,089 lines) — schema, scoring, submission management
- `New/Core/lib/interactive-book-pages.php` (358 lines) — static pages, TOC, page-view tracking
- `New/Student/Book speaking recording from browser/interactive-books/arabic-for-daily-life-beginner/renderer.php` (657 lines) — all section renderers
- `New/Student/Book lessons - reviews - final review/student-book-lesson.php` (366 lines) — lesson page orchestrator
- `New/Student/Book feedback/student-book-feedback.php` (182 lines) — student feedback view
- `New/Teacher/Interactive Book submissions review/teacher-book-submissions.php` (120 lines) — submissions list
- `New/Teacher/Interactive Book feedback/teacher-book-submission-review.php` (492 lines) — teacher review page
- `New/Core/api/book-save-draft.php` (33 lines)
- `New/Core/api/book-submit-lesson.php` (185 lines)
- `New/Core/api/book-upload-speaking.php` (53 lines)
- `New/Core/api/book-post-feedback.php` (77 lines)
- `New/Core/api/book-audio-activity.php` (31 lines)

---

## 1. Distinct UI Sections

### Student: Book List Page (`/student/book`)
- Grid of book cards (title, level, progress bar, status)
- Locked book: offer badge (AED 80 vs 120), Request Activation button
- Unlocked book: Continue Learning button → lesson by lesson

### Student: Book View Page (`/student/book/:bookId`)
- Hero: book title, level, description
- Table of contents: lesson rows with status chip (not_started / in_progress / submitted / completed) + Continue button
- Static pages (cover, TOC header, sounds guide) — non-interactive

### Student: Lesson Page (`/student/book/lesson/:lessonId`)
**Header section:**
- Lesson title (en + ar), unit label (Lesson N / Review N), level badge, status badge
- Progress bar (0% → 35% in_progress → 80% submitted → 100% completed)
- Previous/Next lesson navigation (disabled in phase 10)

**Status alert:** (when submitted/feedback_sent/completed)
- Shows current status + link to feedback

**Form sections** (all wrapped in one `<form>` submitted as FormData):

| Section | Trigger key in `content` | Input type |
|---|---|---|
| Goal block | always | display only |
| Review overview | `review_overview` | display only |
| Situation | `situation_en` | display only |
| Safety disclaimer | `safety_disclaimer_en/ar` | display only |
| Warmup | `warmup_questions` | `<input>` per question |
| Conversation chunks | `conversation_chunks` | display only |
| Vocabulary cards | `vocabulary` | audio button + weak-word button |
| Audio blocks | `audio_blocks` | `<audio>` or placeholder |
| Useful sentences | `sentences` | audio + practice buttons |
| Grammar tip | `grammar_tip` | display only |
| Mini dialogue | `dialogue_ar` | collapsible translation |
| MCQ | `mcq[]` | radio groups |
| Listening review | `listening_review[]` | radio groups |
| Reading comprehension | `reading_comprehension[]` | radio groups |
| Color recognition | `color_recognition[]` | radio groups |
| Number recognition | `number_recognition[]` | radio groups |
| Time recognition | `time_recognition[]` | radio groups |
| Direction recognition | `direction_recognition[]` | radio groups |
| Work sentence practice | `work_sentence_practice[]` | radio groups |
| Pain sentence practice | `pain_sentence_practice[]` | radio groups |
| Topic recognition | `topic_recognition[]` | radio groups |
| Topic category | `topic_category[]` | radio groups |
| Category practice | `category_practice[]` | radio groups |
| Price recognition | `price_recognition[]` | radio groups |
| Listening numbers | `listening_numbers[]` | radio groups |
| Matching | `matching[]` | `<select>` per item |
| Description matching | `description_matching[]` | `<select>` per item |
| Daily action matching | `daily_action_matching[]` | `<select>` per item |
| Direction matching | `direction_matching[]` | `<select>` per item |
| Job matching | `job_matching[]` | `<select>` per item |
| Workplace matching | `workplace_matching[]` | `<select>` per item |
| Body matching | `body_matching[]` | `<select>` per item |
| Health phrase matching | `health_phrase_matching[]` | `<select>` per item |
| Conversation phrase matching | `conversation_phrase_matching[]` | `<select>` per item |
| Vocabulary matching | `vocabulary_matching[]` | `<select>` per item |
| Sequence practice | `sequence_practice[]` | order `<select>` per item |
| Complete sentence | `complete_sentence[]` | `<input dir="rtl">` per item |
| Complete conversation | `complete_conversation[]` | `<input dir="rtl">` per item |
| Arrange words | `arrange_words[]` | word chips + `<input dir="rtl">` |
| Writing task (single) | `writing_title` | `<textarea>` |
| Writing tasks (keyed) | `writing_tasks[]` | one `<textarea>` per task |
| Speaking task (single) | `speaking_title` (no `speaking_tasks`) | MediaRecorder + audio preview |
| Speaking tasks (keyed) | `speaking_tasks[]` | one MediaRecorder per task |
| Self-check | `self_check{}` | checkboxes |
| Submit block | always | Save Draft + Submit buttons |
| Feedback area | always | link to feedback if submitted |

**Submit validation (client-side):**
- All radio/select questions must be answered
- Writing tasks: min sentences check (split on `.!؟\n`)
- Speaking: audio_url must be set for all tasks
- Self-check: `>= self_check_min` items checked

### Student: Feedback Page (`/student/book/feedback/:submissionId`)
- Score summary: status, auto_score%, teacher_score%
- Teacher final feedback text
- Writing task display + teacher writing correction + correction notes
- Speaking: audio player + pronunciation_note + fluency_note + correction_note
- CTA: Practice Again / Back to Book
- Marketing popup (if no access + feedback_popup_enabled)

### Teacher: Submissions List (`/teacher/book-submissions`)
- Filter bar: search (student name/code/book/lesson) + status dropdown
- Table: Student | Book | Lesson | Status | Auto Score | Submitted | Review button

### Teacher: Submission Review (`/teacher/book-submissions/:submissionId`)
- Info header: student, lesson, status badge, auto score, submitted date
- Auto-graded exercises: all 26 question types with correct/wrong badges
- Open-ended answers: complete_sentence + complete_conversation display
- Writing section: display writing task → textarea for correction + textarea for correction notes
- Speaking section: audio player(s) → pronunciation/fluency/correction notes + speaking score + overall speaking feedback textarea
- Final feedback: textarea + teacher score input + "Send Feedback" button

---

## 2. Data Fetching

### Backend API files to create

**Student endpoints** (session: `$_SESSION['student_id']`):
```
GET  /api/student/book-list.php          → BookListData
GET  /api/student/book-view.php?book_id  → BookViewData
GET  /api/student/book-lesson.php?lesson_id → BookLessonData
GET  /api/student/book-feedback.php?submission_id → FeedbackPageData
POST /api/student/book-save-draft.php    → { submission_id, auto_score }
POST /api/student/book-submit-lesson.php → { submission_id, auto_score }
POST /api/student/book-upload-speaking.php → { audio_url, duration_seconds }
POST /api/student/book-audio-activity.php  → ok
POST /api/student/book-add-weak-word.php   → ok
```

**Teacher endpoints** (session: `$_SESSION['teacher_logged']`):
```
GET  /api/teacher/book-submissions.php?status=&q= → SubmissionsListData
GET  /api/teacher/book-submission.php?submission_id → SubmissionDetailData
POST /api/teacher/book-post-feedback.php → { submission_id }
```

### Query patterns

| Hook | When | Stale time |
|---|---|---|
| `useBookList` | On mount | 60s |
| `useBookView(bookId)` | On mount | 30s |
| `useBookLesson(lessonId)` | On mount | 0 (always fresh — current answers) |
| `useBookFeedback(submissionId)` | On mount | 0 (always fresh) |
| `useBookSubmissions(params)` | On mount + filter change | 30s |
| `useBookSubmission(id)` | On mount | 0 |

### Library files to port

```
backend/lib/interactive-books.php          ← New/Core/lib/interactive-books.php
backend/lib/interactive-book-pages.php     ← New/Core/lib/interactive-book-pages.php
backend/interactive-books/arabic-for-daily-life-beginner/
  lessons/lesson-1.php ... lesson-12.php
  lessons/review-unit-1.php
  lessons/review-unit-2.php
  lessons/final-review.php
```

Key functions in `interactive-books.php` to preserve:
- `interactive_books_ensure_schema($pdo)` — 7 tables
- `interactive_books_lesson($pdo, $lessonId)` — JOIN books + book_lessons
- `interactive_books_student_can_access($pdo, $studentId, $bookId)` — access control
- `interactive_books_get_or_create_submission($pdo, $studentId, $bookId, $lessonId)` — creates draft
- `interactive_books_current_submission($pdo, $studentId, $lessonId)` — latest submission
- `interactive_books_submission_answers($submission)` — JSON decode
- `interactive_books_lesson_content($lessonNumber, $slug)` — loads lesson PHP file
- `interactive_books_build_answers_json($_POST, $lessonNumber, $slug)` — builds + scores answers
- `interactive_books_score_answers($answers, $content)` — auto-scores 26 types
- `interactive_books_notify_teacher($pdo, $submissionId, $studentName)` — platform_notify
- `interactive_books_notify_student_feedback($pdo, $studentId, $submissionId)` — platform_notify
- `interactive_books_touch_access($pdo, $studentId, $bookId)` — sets started_at

---

## 3. User Interactions

### Student — Audio
- Click audio button on vocab card → `new Audio(src).play()` + POST `book-audio-activity` (fire-and-forget)
- Click "Mark as practiced" (when audio missing) → POST `book-audio-activity` with `marked_practiced=1`
- Click "Play" on sentence → fire-and-forget audio
- Click "Practice" on sentence → alert with Arabic text (browser native)
- Click "Practice Role A/B" on dialogue → placeholder (audio key sent)

### Student — Weak Words
- Click "Add to Weak Words" → POST `book-add-weak-word`, disable button, show "Added" badge

### Student — Recording (MediaRecorder API)
- Click "Start Recording" → `navigator.mediaDevices.getUserMedia({ audio: true })`
- Click "Stop" → blob → POST `book-upload-speaking` as FormData → get back `audio_url`
- `audio_url` stored in hidden input → validated on submit
- Multiple speaking tasks: each has its own start/stop/status/preview via `data-speaking-key`

### Student — Form Save + Submit
- "Save Draft" → POST `/api/student/book-save-draft` → alert "Draft saved"
- "Submit Lesson" → client-side validation → POST `/api/student/book-submit-lesson` → redirect to `/student/book/feedback/:submissionId?submitted=1`

### Student — Feedback page
- Open → if status = `feedback_sent`, auto-transitions to `completed` (server-side on GET)
- "Practice Again" → navigate to lesson page

### Teacher — Submissions
- Filter: status dropdown + search input → GET with params
- "Review" → navigate to `/teacher/book-submissions/:submissionId`

### Teacher — Feedback form
- Fill feedback fields → POST `book-post-feedback` → updates submission + speaking + book_feedback rows + notifies student

---

## 4. Component Breakdown with Line Estimates

### Shared feature root: `src/shared/interactive-book/`

```
interactive-book/
├── types.ts                     (~120 lines)
├── api.ts                       (~100 lines)
├── README.md
│
├── student/
│   ├── BookListPage.tsx         (~80 lines)
│   ├── BookViewPage.tsx         (~90 lines)
│   ├── LessonPage.tsx           (~180 lines) ← orchestrator
│   ├── FeedbackPage.tsx         (~120 lines)
│   │
│   ├── hooks/
│   │   ├── useBookList.ts       (~30 lines)
│   │   ├── useBookView.ts       (~30 lines)
│   │   ├── useBookLesson.ts     (~30 lines)
│   │   ├── useBookFeedback.ts   (~30 lines)
│   │   ├── useSaveDraft.ts      (~30 lines)
│   │   ├── useSubmitLesson.ts   (~50 lines) ← validation logic here
│   │   ├── useUploadSpeaking.ts (~30 lines)
│   │   └── useMediaRecorder.ts  (~80 lines) ← custom hook
│   │
│   └── components/
│       ├── BookCard.tsx         (~80 lines)
│       ├── BookContents.tsx     (~80 lines)
│       ├── LessonHeader.tsx     (~60 lines)
│       ├── LessonGoalBlock.tsx  (~50 lines)
│       ├── ReviewOverviewBlock.tsx (~50 lines)
│       ├── SituationBlock.tsx   (~40 lines)
│       ├── WarmupBlock.tsx      (~50 lines)
│       ├── ConversationChunksBlock.tsx (~50 lines)
│       ├── VocabularyGrid.tsx   (~80 lines) ← grid of VocabCard
│       ├── VocabCard.tsx        (~70 lines) ← audio + weak word
│       ├── AudioBlock.tsx       (~50 lines)
│       ├── SentencesList.tsx    (~60 lines)
│       ├── GrammarTipBlock.tsx  (~60 lines)
│       ├── DialogueBlock.tsx    (~70 lines) ← collapsible translation
│       ├── ChoiceBlock.tsx      (~70 lines) ← generic MCQ / radio (all 14 choice types)
│       ├── MatchingBlock.tsx    (~60 lines) ← generic dropdown match (all 10 match types)
│       ├── SequenceBlock.tsx    (~60 lines)
│       ├── CompleteSentenceBlock.tsx (~50 lines)
│       ├── CompleteConversationBlock.tsx (~40 lines)
│       ├── ArrangeWordsBlock.tsx (~60 lines) ← word chips + input
│       ├── WritingBlock.tsx     (~50 lines) ← single writing textarea
│       ├── WritingTasksBlock.tsx (~60 lines) ← multiple keyed textareas
│       ├── SpeakingBlock.tsx    (~80 lines) ← single recorder
│       ├── SpeakingTasksBlock.tsx (~90 lines) ← multiple keyed recorders
│       ├── SelfCheckBlock.tsx   (~50 lines)
│       ├── SubmitBlock.tsx      (~60 lines)
│       ├── FeedbackSummary.tsx  (~50 lines)
│       └── FeedbackWritingSection.tsx (~60 lines)
│
└── teacher/
    ├── BookSubmissionsPage.tsx  (~100 lines)
    ├── SubmissionReviewPage.tsx (~160 lines)
    │
    ├── hooks/
    │   ├── useBookSubmissions.ts (~40 lines)
    │   ├── useBookSubmission.ts  (~30 lines)
    │   └── usePostFeedback.ts    (~40 lines)
    │
    └── components/
        ├── SubmissionRow.tsx          (~50 lines)
        ├── SubmissionsFilter.tsx      (~50 lines)
        ├── AutoGradedSection.tsx      (~160 lines) ← all 26 question types displayed
        ├── OpenEndedAnswersSection.tsx (~60 lines)
        ├── WritingReviewSection.tsx   (~80 lines)
        ├── SpeakingReviewSection.tsx  (~100 lines)
        └── FinalFeedbackSection.tsx   (~70 lines)
```

**Total estimate: ~44 frontend files**

---

## 5. What Goes Where

### `api.ts`
```typescript
// Student
export const fetchBookList = () => apiClient<BookListData>('/api/student/book-list.php')
export const fetchBookView = (bookId: number) => apiClient<BookViewData>(`/api/student/book-view.php?book_id=${bookId}`)
export const fetchBookLesson = (lessonId: number) => apiClient<BookLessonData>(`/api/student/book-lesson.php?lesson_id=${lessonId}`)
export const fetchBookFeedback = (submissionId: number) => apiClient<FeedbackPageData>(`/api/student/book-feedback.php?submission_id=${submissionId}`)
export const saveDraft = (fd: FormData) => apiClient<DraftResult>('/api/student/book-save-draft.php', { method: 'POST', body: fd })
export const submitLesson = (fd: FormData) => apiClient<SubmitResult>('/api/student/book-submit-lesson.php', { method: 'POST', body: fd })
export const uploadSpeaking = (fd: FormData) => apiClient<SpeakingUploadResult>('/api/student/book-upload-speaking.php', { method: 'POST', body: fd })
export const trackAudioActivity = (fd: FormData) => apiClient('/api/student/book-audio-activity.php', { method: 'POST', body: fd })
export const addWeakWord = (fd: FormData) => apiClient('/api/student/book-add-weak-word.php', { method: 'POST', body: fd })

// Teacher
export const fetchSubmissions = (params: SubmissionsParams) => apiClient<SubmissionsListData>(...)
export const fetchSubmission = (id: number) => apiClient<SubmissionDetailData>(...)
export const postFeedback = (fd: FormData) => apiClient('/api/teacher/book-post-feedback.php', { method: 'POST', body: fd })
```

### `hooks/`
- `useBookList`, `useBookView`, `useBookLesson`, `useBookFeedback` → thin `useQuery` wrappers
- `useSaveDraft` → `useMutation` with alert on success
- `useSubmitLesson` → `useMutation` with client-side validation + `useNavigate` on success
- `useUploadSpeaking` → `useMutation`, called from `useMediaRecorder`
- `useMediaRecorder(speakingKey?)` → custom hook:
  - State: `status: 'idle' | 'recording' | 'uploading' | 'done' | 'error'`
  - `start()` → `getUserMedia` → `MediaRecorder.start()`
  - `stop()` → `recorder.stop()` → blob → calls `uploadSpeaking` mutation → sets `audioUrl`
  - Returns: `{ start, stop, status, audioUrl, statusText }`

### `components/`
- Pure display + controlled inputs via props
- No fetch calls inside components
- `LessonPage` is the orchestrator: manages `answers` state, passes sections their slice + onChange, builds FormData on submit
- `ChoiceBlock` is reused for ALL 14 radio-type questions (takes `questionType` prop)
- `MatchingBlock` is reused for ALL 10 dropdown matching types (takes `questionType` + `options` prop)
- `AutoGradedSection` loops over all 26 question types and conditionally renders each

---

## 6. TypeScript Types

```typescript
// types.ts

export type LessonStatus =
  | 'draft' | 'in_progress' | 'submitted'
  | 'needs_correction' | 'feedback_sent' | 'completed' | 'resubmitted'

export type UnitType = 'lesson' | 'review'

export interface Book {
  id: number
  title_en: string
  title_ar: string
  slug: string
  level: string
  status: string
  price: number
}

export interface BookLesson {
  id: number
  lesson_number: number
  unit_type: UnitType
  title_en: string
  title_ar: string
  slug: string
  submission_status?: LessonStatus
  auto_score?: number
  submission_id?: number
}

export interface VocabCard {
  key: string
  arabic: string
  pronunciation: string
  meaning: string
  example: string
  category?: string
}

export interface Sentence {
  ar: string
  en: string
}

export interface AudioBlock {
  key: string
  title: string
  file: string
}

export interface GrammarTip {
  title?: string
  body?: string
  examples?: Array<{ ar: string; en: string }>
}

export interface ReviewGroup {
  title: string
  items: string[]
}

export interface ConversationChunk {
  title?: string
  arabic: string[]
  note?: string
}

export interface ChoiceQuestion {
  id: string
  question: string
  options: Record<string, string>
}

export interface MatchingItem {
  id: string
  arabic: string
}

export interface SequenceItem {
  id: string
  sentence: string
}

export interface CompleteItem {
  id: string
  prompt: string
}

export interface ArrangeWordsItem {
  id: string
  words: string[]
}

export interface SpeakingTask {
  key: string
  title?: string
  instructions?: string
  max_duration_label?: string
}

export interface WritingTask {
  key: string
  title?: string
  instructions?: string
  placeholder?: string
  min_sentences?: number
}

export interface LessonContent {
  lesson_number: number
  unit_type: UnitType
  display_label?: string
  goal_en: string
  goal_ar: string
  goal_checks?: string[]
  situation_en?: string
  situation_ar?: string
  safety_disclaimer_en?: string
  safety_disclaimer_ar?: string
  warmup_title?: string
  warmup_questions?: string[]
  conversation_chunks?: ConversationChunk[]
  vocabulary?: VocabCard[]
  audio_blocks?: AudioBlock[]
  sentences?: Sentence[]
  grammar_tip?: GrammarTip
  dialogue_ar?: string[]
  dialogue_en?: string[]
  review_overview?: ReviewGroup[]
  self_check?: Record<string, string>
  self_check_min?: number
  submit_label?: string
  // 26 auto-scored exercise types:
  mcq?: ChoiceQuestion[]
  number_recognition?: ChoiceQuestion[]
  listening_numbers?: ChoiceQuestion[]
  listening_review?: ChoiceQuestion[]
  color_recognition?: ChoiceQuestion[]
  time_recognition?: ChoiceQuestion[]
  direction_recognition?: ChoiceQuestion[]
  work_sentence_practice?: ChoiceQuestion[]
  pain_sentence_practice?: ChoiceQuestion[]
  topic_recognition?: ChoiceQuestion[]
  topic_category?: ChoiceQuestion[]
  category_practice?: ChoiceQuestion[]
  price_recognition?: ChoiceQuestion[]
  reading_comprehension?: ChoiceQuestion[]
  matching?: MatchingItem[]
  matching_options?: string[]
  description_matching?: MatchingItem[]
  description_matching_options?: string[]
  daily_action_matching?: MatchingItem[]
  daily_action_matching_options?: string[]
  direction_matching?: MatchingItem[]
  direction_matching_options?: string[]
  job_matching?: MatchingItem[]
  job_matching_options?: string[]
  workplace_matching?: MatchingItem[]
  workplace_matching_options?: string[]
  body_matching?: MatchingItem[]
  body_matching_options?: string[]
  health_phrase_matching?: MatchingItem[]
  health_phrase_matching_options?: string[]
  conversation_phrase_matching?: MatchingItem[]
  conversation_phrase_matching_options?: string[]
  vocabulary_matching?: MatchingItem[]
  vocabulary_matching_options?: string[]
  sequence_practice?: SequenceItem[]
  complete_sentence?: CompleteItem[]
  complete_conversation?: CompleteItem[]
  arrange_words?: ArrangeWordsItem[]
  // Open-ended:
  writing_title?: string
  writing_instructions?: string
  writing_placeholder?: string
  min_sentences?: number
  writing_tasks?: WritingTask[]
  speaking_title?: string
  speaking_instructions?: string
  speaking_tasks?: SpeakingTask[]
}

export interface LessonSubmission {
  id: number
  status: LessonStatus
  answers_json: string
  auto_score: number
  teacher_score?: number
  final_feedback?: string
  submitted_at?: string
  reviewed_at?: string
}

export interface AnswerRow {
  question_id: string
  answer: string
  is_correct?: boolean
  sentence?: string
}

export interface ParsedAnswers {
  warmup?: Record<string, string>
  writing_task?: { answer: string }
  writing_tasks?: Record<string, { answer: string }>
  speaking_task?: { audio_url: string; duration_seconds: number }
  speaking_tasks?: Record<string, { audio_url: string; duration_seconds: number }>
  self_check?: string[]
  [exerciseType: string]: AnswerRow[] | unknown
}

export interface SpeakingSubmission {
  audio_url?: string
  teacher_feedback?: string
  pronunciation_note?: string
  fluency_note?: string
  correction_note?: string
  score?: number
}

export interface TeacherFeedback {
  writing?: string
  correction?: string
  speaking?: string
  general?: string
}

// GET /api/student/book-list.php
export interface BookListData {
  books: Array<Book & { access_status: string; progress_pct: number }>
}

// GET /api/student/book-view.php
export interface BookViewData {
  book: Book
  lessons: BookLesson[]
  continue_lesson_id?: number
}

// GET /api/student/book-lesson.php
export interface BookLessonData {
  lesson: BookLesson & { book_title_en: string; book_level: string }
  content: LessonContent
  submission: LessonSubmission | null
  answers: ParsedAnswers
}

// GET /api/student/book-feedback.php
export interface FeedbackPageData {
  submission: LessonSubmission & { lesson_title: string; book_title: string; lesson_id: number; unit_type: UnitType }
  answers: ParsedAnswers
  feedback: TeacherFeedback
  speaking: SpeakingSubmission
}

// GET /api/teacher/book-submissions.php
export interface SubmissionRow {
  id: number
  student_name: string
  login_code: string
  book_title: string
  lesson_title: string
  lesson_number: number
  unit_type: UnitType
  status: LessonStatus
  auto_score: number
  submitted_at?: string
}

export interface SubmissionsListData {
  submissions: SubmissionRow[]
}

// GET /api/teacher/book-submission.php
export interface SubmissionDetailData {
  submission: SubmissionRow & { final_feedback?: string; teacher_score?: number; reviewed_at?: string }
  answers: ParsedAnswers
  speaking: SpeakingSubmission
  feedback: TeacherFeedback
}
```

---

## 7. DB Schema (from `interactive_books_ensure_schema`)

```sql
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL DEFAULT '',
  slug VARCHAR(100) NOT NULL UNIQUE,
  level VARCHAR(50) NOT NULL DEFAULT 'beginner',
  status ENUM('draft','active','archived') NOT NULL DEFAULT 'active',
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00
)

CREATE TABLE book_lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  lesson_number INT NOT NULL DEFAULT 1,
  unit_type ENUM('lesson','review') NOT NULL DEFAULT 'lesson',
  sort_order INT NOT NULL DEFAULT 0,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL DEFAULT '',
  slug VARCHAR(100) NOT NULL DEFAULT '',
  status ENUM('draft','active') NOT NULL DEFAULT 'active'
)

CREATE TABLE student_book_access (
  student_id INT NOT NULL,
  book_id INT NOT NULL,
  access_status ENUM('active','expired','suspended') NOT NULL DEFAULT 'active',
  purchase_status ENUM('free','paid','granted') NOT NULL DEFAULT 'free',
  started_at DATETIME,
  expires_at DATETIME,
  PRIMARY KEY (student_id, book_id)
)

CREATE TABLE book_lesson_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  book_id INT NOT NULL,
  lesson_id INT NOT NULL,
  status ENUM('draft','in_progress','submitted','needs_correction','feedback_sent','completed','resubmitted') NOT NULL DEFAULT 'draft',
  answers_json LONGTEXT,
  auto_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  teacher_score DECIMAL(5,2),
  submitted_at DATETIME,
  reviewed_at DATETIME,
  reviewed_by INT,
  final_feedback TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

CREATE TABLE book_speaking_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT,
  student_id INT NOT NULL,
  book_id INT NOT NULL,
  lesson_id INT NOT NULL,
  audio_url VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL DEFAULT '',
  mime_type VARCHAR(100) NOT NULL DEFAULT '',
  duration_seconds INT NOT NULL DEFAULT 0,
  teacher_feedback TEXT,
  pronunciation_note TEXT,
  fluency_note TEXT,
  correction_note TEXT,
  score DECIMAL(5,2)
)

CREATE TABLE book_audio_activity (
  student_id INT NOT NULL,
  book_id INT NOT NULL,
  lesson_id INT NOT NULL,
  audio_key VARCHAR(100) NOT NULL,
  play_count INT NOT NULL DEFAULT 0,
  first_played_at DATETIME,
  last_played_at DATETIME,
  marked_practiced TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, book_id, lesson_id, audio_key)
)

CREATE TABLE book_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  teacher_id INT NOT NULL,
  feedback_type ENUM('writing','correction','speaking','general') NOT NULL,
  feedback_text TEXT NOT NULL
)

CREATE TABLE book_page_views (
  student_id INT NOT NULL,
  book_id INT NOT NULL,
  page_key VARCHAR(100) NOT NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, book_id, page_key)
)
```

---

## 8. Submission Status Flow

```
not_started
    → [GET lesson] → draft (created on first load)
    → [Save Draft] → in_progress
    → [Submit]     → submitted
                       → [Teacher sends feedback] → feedback_sent
                       → [Student opens feedback] → completed
```

Progress bar mapping:
- `feedback_sent` | `completed` → 100%
- `submitted` | `needs_correction` → 80%
- `in_progress` | `draft` → 35%
- default → 0%

---

## 9. Key Architecture Decisions

### A. One shared feature, split by role consumer
The entire interactive book lives in `src/shared/interactive-book/`. Student role and Teacher role each route into it. This avoids duplicating the 30+ renderer components.

### B. FormData over JSON for submission
The lesson form uses `FormData` (not JSON) for `save-draft` and `submit-lesson` because speaking audio_url is a hidden input, and the backend validates all fields server-side. The API takes raw `$_POST`.

### C. Central answers state in LessonPage
`LessonPage` owns a single `answers: ParsedAnswers` state object, initialized from `useBookLesson` data. Each section receives its slice via props. On Save Draft / Submit, `LessonPage` builds a `FormData` by iterating answers. This avoids uncontrolled form inputs.

### D. ChoiceBlock is generic (not 14 copies)
All 14 radio-type question groups use one `ChoiceBlock` component that takes `questionType: string` and `questions: ChoiceQuestion[]`. Same for `MatchingBlock` handling all 10 dropdown-match types.

### E. useMediaRecorder is a custom hook
Browser MediaRecorder API has complex state. Encapsulate in `useMediaRecorder(speakingKey?: string)` returning `{ start, stop, status, audioUrl, statusText }`. Each speaking task instance gets its own hook call.

### F. Speaking upload is fire-before-submit
Audio is uploaded immediately on recorder stop (to `/api/student/book-upload-speaking.php`), not at form submit. The returned `audio_url` is stored in state. Submit validation checks that all `speaking_tasks` keys have non-empty `audio_url`.

### G. Audio tracking is fire-and-forget
POST to `/api/student/book-audio-activity.php` has no success/error handler. It's called without awaiting in a `useCallback` attached to play/click events.

---

## 10. Backend PHP File Paths

```
backend/api/student/book-list.php
backend/api/student/book-view.php
backend/api/student/book-lesson.php
backend/api/student/book-feedback.php
backend/api/student/book-save-draft.php
backend/api/student/book-submit-lesson.php
backend/api/student/book-upload-speaking.php
backend/api/student/book-audio-activity.php
backend/api/student/book-add-weak-word.php
backend/api/teacher/book-submissions.php
backend/api/teacher/book-submission.php
backend/api/teacher/book-post-feedback.php
backend/lib/interactive-books.php
backend/lib/interactive-book-pages.php
backend/interactive-books/arabic-for-daily-life-beginner/lessons/lesson-1.php
  ... (12 lessons + 3 reviews)
```

Backend lib path in endpoints: `require_once __DIR__ . '/../../lib/interactive-books.php'`

---

## 11. Sprint Breakdown Estimate

| Sprint | Scope | Files |
|---|---|---|
| 10.1 | Types + API + Hooks (student) | ~12 |
| 10.2 | Student: BookList + BookView + LessonHeader + static sections | ~12 |
| 10.3 | Student: All exercise sections (ChoiceBlock, MatchingBlock, etc.) | ~14 |
| 10.4 | Student: Writing + Speaking + SelfCheck + SubmitBlock + FeedbackPage | ~10 |
| 10.5 | Teacher: SubmissionsList + SubmissionReview + FeedbackForm | ~10 |
| 10.6 | Backend PHP files (12 endpoints + 2 lib ports + lesson PHP files) | ~16 |
| 10.7 | Routes wiring + TSC/ESLint clean | ~4 |

Total estimate: ~78 files
