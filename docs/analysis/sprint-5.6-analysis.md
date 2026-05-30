# Sprint 5.6 Analysis — Materials + Book Submissions (Teacher Side)

## File Name Mismatches

| User Reference | Actual Source | Notes |
|---------------|--------------|-------|
| `backend/api/teacher/materials.php` | **Does NOT exist as one file** | Splits into 3 files below |
| `backend/api/teacher/book-submissions.php` | **Does NOT exist as REST** | Original is a PHP page, not a REST endpoint |

### Materials — actual source files:
| Source | Destination | Status |
|--------|-------------|--------|
| `New/Core/api/teacher/materials-save.php` | `backend/api/teacher/materials-save.php` | PORT |
| `New/Core/api/teacher/materials-delete.php` | `backend/api/teacher/materials-delete.php` | PORT |
| `New/Core/api/teacher/student-materials.php` | `backend/api/teacher/student-materials.php` | **ALREADY EXISTS** |

### Book Submissions — actual source files:
| Source | Destination | Notes |
|--------|-------------|-------|
| `New/Teacher/Interactive Book submissions review/teacher-book-submissions.php` | `backend/api/teacher/book-submissions.php` | Convert PHP page → REST GET |
| `New/Teacher/Interactive Book submissions review/teacher-book-submission-review.php` | `backend/api/teacher/book-submission-detail.php` | Convert PHP page → REST GET |
| `New/Core/api/book-post-feedback.php` | `backend/api/teacher/book-post-feedback.php` | PORT |

---

## 1. Business Rules

### A — Course Materials

Materials are resources (PDF, video, audio, link, article, etc.) assigned by the teacher to specific students.

#### Material Lifecycle
1. Teacher creates material (URL or file upload) → `status: draft | published | hidden | archived`
2. On `published` → push-notify student
3. Student views/downloads → tracked in `material_progress`
4. On delete:
   - If `material_progress` has entries → **soft-archive** (status = 'archived', not deleted)
   - If no progress → **hard-delete** + unlink file from disk

#### Material Types
```
video       — uploaded video file
video_link  — YouTube/Vimeo embed URL (auto-detected from URL)
audio       — uploaded audio file
pdf         — uploaded PDF
pptx        — uploaded PowerPoint
document    — uploaded Word doc
image       — uploaded image
link        — external URL
article     — text-only (no URL required)
html        — HTML lesson
mixed       — mixed content
```

#### Material Categories
```
lesson_slides | reading_practice | listening_practice | speaking_support
writing_practice | vocabulary | grammar_support | child_literacy
work_arabic | emirati_dialect | egyptian_dialect | homework_support | review_material
```

#### Field Rules
| Field | Rules |
|-------|-------|
| `student_id` | required, > 0 |
| `title` | required |
| `type` | one of materials_types() keys |
| `source_type` | `url` or `file` |
| `url` | required if source_type=url (except article/mixed); must start with http(s) |
| `material_file` | required if source_type=file AND id=0 (new) |
| `status` | `draft \| published \| hidden \| archived` |
| `language` | `arabic \| english \| both` |
| `estimated_study_minutes` | 0–999 |
| `allow_download` | checkbox → 0 or 1 |
| `show_on_homepage` | checkbox → 0 or 1 |

#### File Upload Rules
- Max size: 80 MB
- Blocked extensions: `php, phtml, exe, bat, cmd, sh, js, msi, dll, com, scr, ps1`
- Allowed: `pdf, jpg, jpeg, png, gif, webp, mp4, webm, mp3, ogg, wav, m4a, doc, docx, ppt, pptx, html, htm`
- Upload path: `uploads/materials/mat_{studentId}_{timestamp}_{random}.{ext}`
- If updating with a new file → old file deleted from disk

#### Video Link Auto-Detection
If `source_type=url` and type is `video` or `link` and URL matches `materials_video_embed_url()` → type is automatically changed to `video_link`.

---

### B — Book Submissions

Students submit interactive book lessons; teachers review them and send feedback.

#### Submission Statuses
```
draft → in_progress → submitted → needs_correction
                   ↓
              feedback_sent ← (after teacher sends feedback)
                   ↓
               completed | resubmitted
```

#### Teacher Review Flow
1. Teacher sees list of submissions (`GET book-submissions.php`)
2. Clicks "Review" → loads submission detail (`GET book-submission-detail.php?submission_id=X`)
3. Detail shows:
   - **Auto-graded answers** (MCQ, arrange_words, matching, etc.) — read-only with correct/wrong badges
   - **Complete sentence / conversation** answers — text display only
   - **Writing task** — student's text + textarea for teacher's written feedback + correction notes
   - **Speaking task** — audio player + pronunciation note + fluency note + correction note + speaking score
   - **Final feedback** — overall textarea + teacher score (0–100)
4. Teacher submits → `POST book-post-feedback.php`
5. Backend: upserts `book_feedback` rows, updates `book_speaking_submissions`, sets `book_lesson_submissions.status = 'feedback_sent'`, notifies student

#### Answer Types in `answers_json`
**Auto-graded (correct/wrong badges):**
```
mcq, arrange_words, number_recognition, listening_review, time_recognition,
direction_recognition, category_practice, price_recognition, color_recognition,
description_matching, matching, daily_action_matching, direction_matching,
job_matching, workplace_matching, work_sentence_practice, body_matching,
health_phrase_matching, pain_sentence_practice, conversation_phrase_matching,
topic_recognition, reading_comprehension, vocabulary_matching, topic_category,
sequence_practice, listening_numbers
```

**Teacher-graded (display text for feedback):**
```
complete_sentence, complete_conversation, writing_tasks, writing_task,
speaking_tasks, speaking_task
```

---

## 2. Database Schema

### `course_materials`
```sql
id UINT AI PK,
student_id UINT NOT NULL DEFAULT 0,
title VARCHAR(300) NOT NULL,
type VARCHAR(40) DEFAULT 'link',
category VARCHAR(80) DEFAULT '',
level VARCHAR(40) DEFAULT '',
tags VARCHAR(500) DEFAULT '',
language VARCHAR(20) DEFAULT 'both',
estimated_study_minutes SMALLINT DEFAULT 0,
status VARCHAR(30) DEFAULT 'published',
url VARCHAR(500) DEFAULT '',
file_path VARCHAR(500) DEFAULT '',
original_filename VARCHAR(255) DEFAULT '',
mime_type VARCHAR(120) DEFAULT '',
file_size INT DEFAULT 0,
allow_download TINYINT(1) DEFAULT 1,
description TEXT NULL,
sort_order SMALLINT DEFAULT 0,
is_published TINYINT(1) DEFAULT 1,
show_on_homepage TINYINT(1) DEFAULT 0,
created_by INT DEFAULT 0,
created_at DATETIME,
updated_at DATETIME NULL,
archived_at DATETIME NULL
KEY idx_student (student_id), KEY idx_type (type)
```

### `material_progress`
```sql
id UINT AI PK,
material_id UINT NOT NULL,
student_id UINT NOT NULL,
viewed_at DATETIME NULL,
last_opened_at DATETIME NULL,
completed_at DATETIME NULL,
download_count UINT DEFAULT 0,
status VARCHAR(30) DEFAULT 'assigned',
created_at DATETIME,
updated_at DATETIME NULL,
UNIQUE uniq_material_student (material_id, student_id)
```

### `book_lesson_submissions`
```sql
id INT AI PK,
student_id INT NOT NULL,
book_id INT NOT NULL,
lesson_id INT NOT NULL,
status ENUM('draft','in_progress','submitted','needs_correction','feedback_sent','completed','resubmitted') DEFAULT 'draft',
answers_json LONGTEXT NULL,        -- JSON blob of all exercise answers
auto_score DECIMAL(5,2) DEFAULT 0, -- percentage
teacher_score DECIMAL(5,2) NULL,   -- percentage
submitted_at DATETIME NULL,
reviewed_at DATETIME NULL,
reviewed_by INT NULL,
final_feedback TEXT NULL,
created_at DATETIME,
updated_at DATETIME NULL
```

### `book_speaking_submissions`
```sql
id INT AI PK,
submission_id INT NULL,
student_id INT NOT NULL,
book_id INT NOT NULL,
lesson_id INT NOT NULL,
audio_url VARCHAR(500) NOT NULL,
original_filename VARCHAR(255) NULL,
mime_type VARCHAR(100) NULL,
duration_seconds INT NULL,
teacher_feedback TEXT NULL,
pronunciation_note TEXT NULL,
fluency_note TEXT NULL,
correction_note TEXT NULL,
score DECIMAL(5,2) NULL
```

### `book_feedback`
```sql
id INT AI PK,
submission_id INT NOT NULL,
teacher_id INT DEFAULT 0,
feedback_type ENUM('writing','speaking','general','correction') DEFAULT 'general',
feedback_text TEXT NULL,
audio_feedback_url VARCHAR(500) NULL
```

### `books`
```sql
id INT AI PK,
title_en VARCHAR(255),
title_ar VARCHAR(255),
slug VARCHAR(255) UNIQUE,
level VARCHAR(50),
status ENUM('draft','published','archived')
```

### `book_lessons`
```sql
id INT AI PK,
book_id INT,
lesson_number INT,
unit_type ENUM('lesson','review') DEFAULT 'lesson',
sort_order DECIMAL(5,2) NULL,
title_en VARCHAR(255),
title_ar VARCHAR(255),
slug VARCHAR(255)
```

---

## 3. API Endpoints

### Materials

#### GET `/api/teacher/student-materials.php?student_id=X`
**Already exists in rebuild.** Returns `{ items: MaterialItem[] }`.

Each item has `href` (resolved from file_path or url), `is_file` (bool), `id`, `title`, `type`, `description`, `sort_order`, `is_published`, `created_at`.

#### POST `/api/teacher/materials-save.php`
| Field | Type | Notes |
|-------|------|-------|
| `id` | int | 0 = new |
| `student_id` | int | required |
| `title` | string | required |
| `type` | string | one of materials_types() |
| `category` | string | optional |
| `level` | string | optional |
| `tags` | string | optional |
| `language` | string | `arabic\|english\|both` |
| `estimated_study_minutes` | int | 0–999 |
| `description` | string | optional |
| `sort_order` | int | |
| `status` | string | `draft\|published\|hidden\|archived` |
| `show_on_homepage` | checkbox | 1 if checked |
| `allow_download` | checkbox | 1 if checked |
| `source_type` | string | `url` or `file` |
| `url` | string | required if source_type=url (except article/mixed) |
| `material_file` | file | required if source_type=file AND id=0 |

**Response:** `{ id: number }`

**Requires multipart/form-data when uploading a file.**

#### POST `/api/teacher/materials-delete.php`
| Field | Type |
|-------|------|
| `id` | int |

**Response (soft-archived):** `{ archived: true }`
**Response (hard-deleted):** `{ deleted: true }`

### Book Submissions

#### GET `/api/teacher/book-submissions.php?status=...&q=...` (NEW)
| Param | Type | Notes |
|-------|------|-------|
| `status` | string | optional filter: `submitted\|feedback_sent\|completed\|...` |
| `q` | string | optional search: student name, login_code, book title, lesson title |

**Response:** `{ submissions: BookSubmission[] }` (max 200, ordered by submitted_at DESC)

```typescript
interface BookSubmission {
  id: number
  student_id: number
  full_name: string
  login_code: string
  book_title: string
  lesson_title: string
  lesson_number: number
  unit_type: 'lesson' | 'review'
  status: BookSubmissionStatus
  auto_score: number   // percentage
  teacher_score: number | null
  submitted_at: string | null
  reviewed_at: string | null
}
```

#### GET `/api/teacher/book-submission-detail.php?submission_id=X` (NEW)
**Response:**
```typescript
interface BookSubmissionDetailResponse {
  submission: BookSubmissionMeta   // all fields from book_lesson_submissions + joins
  answers: BookAnswers             // parsed from answers_json
  speaking: BookSpeakingData | null
  feedback: Record<'writing'|'speaking'|'correction'|'general', string>
}
```

#### POST `/api/teacher/book-post-feedback.php`
| Field | Type | Notes |
|-------|------|-------|
| `submission_id` | int | required |
| `final_feedback` | string | overall feedback |
| `teacher_score` | float | 0–100, optional |
| `writing_feedback` | string | writing correction text |
| `correction_feedback` | string | mistake/weak-word notes |
| `speaking_feedback` | string | overall speaking feedback |
| `pronunciation_note` | string | |
| `fluency_note` | string | |
| `speaking_correction_note` | string | |
| `speaking_score` | float | 0–100, optional |

**Response:** `{ submission_id: number }`

Sets `book_lesson_submissions.status = 'feedback_sent'`, `reviewed_at = NOW()`, `reviewed_by = teacher_id`.

---

## 4. TypeScript Interfaces

```typescript
// ── Materials ───────────────────────────────────────────────────────────────

export type MaterialType =
  | 'video' | 'video_link' | 'audio' | 'pdf' | 'pptx' | 'document'
  | 'image' | 'link' | 'article' | 'html' | 'mixed'

export type MaterialStatus = 'draft' | 'published' | 'hidden' | 'archived'
export type MaterialLanguage = 'arabic' | 'english' | 'both'

export interface CourseMaterial {
  id: number
  student_id: number
  title: string
  type: MaterialType
  category: string
  level: string
  tags: string
  language: MaterialLanguage
  estimated_study_minutes: number
  status: MaterialStatus
  description: string | null
  sort_order: number
  is_published: boolean
  show_on_homepage: boolean
  allow_download: boolean
  href: string        // resolved: file_path or url
  is_file: boolean
  created_at: string
  updated_at: string | null
}

export interface MaterialSavePayload {
  id: number
  student_id: number
  title: string
  type: MaterialType
  category?: string
  level?: string
  tags?: string
  language?: MaterialLanguage
  estimated_study_minutes?: number
  description?: string
  sort_order?: number
  status?: MaterialStatus
  show_on_homepage?: number
  allow_download?: number
  source_type: 'url' | 'file'
  url?: string
  // material_file: File — sent via FormData
}

// ── Book Submissions ────────────────────────────────────────────────────────

export type BookSubmissionStatus =
  | 'draft' | 'in_progress' | 'submitted' | 'needs_correction'
  | 'feedback_sent' | 'completed' | 'resubmitted'

export interface BookSubmission {
  id: number
  student_id: number
  full_name: string
  login_code: string
  book_title: string
  lesson_title: string
  lesson_number: number
  unit_type: 'lesson' | 'review'
  status: BookSubmissionStatus
  auto_score: number
  teacher_score: number | null
  submitted_at: string | null
  reviewed_at: string | null
}

export interface BookAnswerItem {
  question_id: string
  answer: string
  is_correct: boolean
}

export interface BookAnswers {
  mcq?: BookAnswerItem[]
  arrange_words?: BookAnswerItem[]
  complete_sentence?: BookAnswerItem[]
  complete_conversation?: BookAnswerItem[]
  writing_task?: { answer: string }
  writing_tasks?: Record<string, { answer: string }>
  speaking_task?: { audio_url?: string }
  speaking_tasks?: Record<string, { audio_url?: string }>
  // + all other auto-graded types
  [key: string]: BookAnswerItem[] | Record<string, unknown> | undefined
}

export interface BookSpeakingData {
  teacher_feedback: string | null
  pronunciation_note: string | null
  fluency_note: string | null
  correction_note: string | null
  score: number | null
}

export interface BookSubmissionDetail {
  submission: {
    id: number
    student_id: number
    full_name: string
    login_code: string
    book_title: string
    lesson_title: string
    lesson_number: number
    unit_type: 'lesson' | 'review'
    status: BookSubmissionStatus
    auto_score: number
    teacher_score: number | null
    submitted_at: string | null
    reviewed_at: string | null
    final_feedback: string | null
  }
  answers: BookAnswers
  speaking: BookSpeakingData | null
  feedback: Record<'writing' | 'speaking' | 'correction' | 'general', string>
}

export interface BookFeedbackPayload {
  submission_id: number
  final_feedback: string
  teacher_score: string
  writing_feedback: string
  correction_feedback: string
  speaking_feedback: string
  pronunciation_note: string
  fluency_note: string
  speaking_correction_note: string
  speaking_score: string
}
```

---

## 5. Frontend Components to Build

### Feature: `roles/teacher/features/materials/`

```
materials/
├── index.ts
├── types.ts
├── api.ts
│   ├── getStudentMaterials(studentId)
│   ├── saveMaterial(formData)         ← FormData (handles both file + URL)
│   └── deleteMaterial(id)
├── components/
│   ├── MaterialRow.tsx               — type icon, title, category badge, status, edit/delete/open buttons
│   ├── MaterialList.tsx              — list + "Add Material" button
│   └── MaterialFormDrawer.tsx        — create/edit: source_type toggle (URL vs file), all fields
├── StudentMaterialsTab.tsx           — replaces old MaterialsTab: list + add/edit/delete capability
└── README.md
```

**Notes:**
- `saveMaterial` sends `FormData` (needed for file uploads AND for URL-only posts)
- When `source_type = 'url'`, still use FormData (apiClient.postForm)
- `material_file` field is only appended to FormData when a File object is provided
- CSRF auto-injected by axios interceptor (works with multipart)

### Feature: `roles/teacher/features/book-submissions/`

```
book-submissions/
├── index.ts
├── types.ts
├── api.ts
│   ├── getSubmissions(status?, q?)
│   ├── getSubmissionDetail(submissionId)
│   └── postFeedback(payload)
├── components/
│   ├── SubmissionRow.tsx             — student name/code, book, lesson, status badge, auto score, Review btn
│   ├── SubmissionList.tsx            — filter by status + search input + list
│   ├── AutoGradedAnswers.tsx         — renders all auto-graded answer groups (correct/wrong chips)
│   └── SubmissionReviewDrawer.tsx    — full review: auto answers, writing, speaking, final feedback form
├── BookSubmissionsPage.tsx           — standalone page: list + drawer, route /teacher/book-submissions
└── README.md
```

**Notes:**
- `SubmissionReviewDrawer` is complex (~190 lines) — split render logic into `AutoGradedAnswers` component
- Drawer uses `key={submission.id}` pattern for remount on new selection
- Speaking audio played inline `<audio controls src={...} />`
- All feedback fields are optional — backend handles empty strings gracefully
- `teacher_score` and `speaking_score` sent as string (backend converts to float)

---

## 6. Backend Files to Port/Create

### Materials (2 files to port)

| Source | Destination | Type |
|--------|-------------|------|
| `New/Core/api/teacher/materials-save.php` | `backend/api/teacher/materials-save.php` | PORT |
| `New/Core/api/teacher/materials-delete.php` | `backend/api/teacher/materials-delete.php` | PORT |
| — | `backend/api/teacher/student-materials.php` | **ALREADY EXISTS** |

### Book Submissions (3 files: 2 new, 1 port)

| Source | Destination | Type |
|--------|-------------|------|
| `New/Teacher/Interactive Book submissions review/teacher-book-submissions.php` | `backend/api/teacher/book-submissions.php` | CONVERT to REST |
| `New/Teacher/Interactive Book submissions review/teacher-book-submission-review.php` | `backend/api/teacher/book-submission-detail.php` | CONVERT to REST |
| `New/Core/api/book-post-feedback.php` | `backend/api/teacher/book-post-feedback.php` | PORT |

---

## 7. Path Fixes (Rebuild Double-Nesting)

All lib and config paths must use double-nesting:

```php
// Materials files need:
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
require_once __DIR__ . '/../../lib/lib/learning-audit.php';
require_once __DIR__ . '/../../lib/lib/materials-library.php';
require_once __DIR__ . '/../../config/config/db.php';

// Book Submissions files need:
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
require_once __DIR__ . '/../../lib/lib/learning-audit.php';
require_once __DIR__ . '/../../config/config/db.php';
```

---

## 8. Edge Cases & Constraints

### Materials
| Case | Handling |
|------|----------|
| Delete with student progress | Soft-archive: `status = 'archived'`, `is_published = 0`, `archived_at = NOW()` |
| Delete without progress | Hard-delete + `@unlink()` file from disk |
| File upload: updating with new file | Delete old file from disk, save new file |
| URL + video type | Auto-detect embed → change type to `video_link` |
| `source_type = url` when updating, was previously a file | Clear `file_path`, `original_filename`, `mime_type`, `file_size` |
| `article` or `mixed` type with no URL | Valid — URL is optional for these types |
| Blocked file extensions | `php, phtml, exe, bat, cmd, sh, js, msi, dll, com, scr, ps1` |
| File too large | Max 80 MB |
| MIME type mismatch | Audio m4a: accepts `audio/x-m4a`, `video/mp4`, `application/octet-stream` variants |

### Book Submissions
| Case | Handling |
|------|----------|
| `answers_json` parsing | `json_decode($submission['answers_json'], true)` then pass to frontend |
| Missing `speaking` row | `book_speaking_submissions` may not exist — return `null`, not error |
| `teacher_score` empty | Sent as empty string → backend sets `NULL` |
| `writing_tasks` vs `writing_task` | Both formats exist — handle both in `BookAnswers` |
| `speaking_tasks` vs `speaking_task` | Both formats exist — handle both |
| Status filter empty string | Return all statuses |
| `unit_type = 'review'` | Display "Review" label instead of lesson number |
| Feedback already exists | Backend does `DELETE + INSERT` (not upsert) for `book_feedback` |
| `interactive_books_ensure_schema` | Must be called before any book DB operations |

---

## 9. Wiring Updates Needed

### `StudentDetailPage.tsx`
- Replace `MaterialsTab` import (from `./components/MaterialsTab`) with `StudentMaterialsTab` from new `../materials` feature
- Replace render `{activeTab === 'materials' && <MaterialsTab ... />}` with `<StudentMaterialsTab ... />`

### `roles/teacher/index.tsx`
- Add route: `<Route path="book-submissions" element={<BookSubmissionsPage />} />`

---

## 10. Rebuild File Count

| Category | Count |
|----------|-------|
| Backend PHP (port/new) | 5 |
| Frontend materials | 8 |
| Frontend book-submissions | 9 |
| Wiring changes | 2 |
| **Total new files** | **24** |
