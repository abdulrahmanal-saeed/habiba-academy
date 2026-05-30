# Sprint 5.4 Analysis — Reviews (Teacher Side)

## Source Files Analyzed

| User Reference | Actual Source File | Notes |
|---------------|-------------------|-------|
| `backend/api/review/create.php` | `New/Core/api/review/create.php` | Teacher creates review |
| `backend/api/teacher/review-grade.php` | `New/Core/api/review/save.php` | **File was misnamed** — `teacher/review-save.php` delegates here |
| — | `New/Core/api/review/update.php` | Edit review before submission |
| — | `New/Core/api/review/student-list.php` | List reviews (teacher view) |
| — | `New/Core/api/review/delete.php` | Simple delete (no submissions) |
| — | `New/Core/api/teacher/review-delete.php` | Full cascade delete with audio |
| — | `New/Core/api/teacher/student-reviews.php` | Delegates to student-list.php |
| — | `New/Core/lib/review/helpers.php` | Schema lib (auto-grade, manual items) |

---

## 1. Business Rules

### Review Types
- `weekly_review` — label: "Weekly Review"
- `monthly_review` — label: "Monthly Review"

### Review Statuses
- `draft` — not visible to student
- `published` — visible after `publish_at` datetime passes
- `closed` — student can no longer submit

### Submission Flow
1. Teacher creates review (schema_json + title + date + status)
2. If published & `publish_at <= NOW()` → student notification sent + WhatsApp reminder pushed to teacher
3. Student submits answers → auto-graded immediately (MCQ/matching/fill_the_blank)
4. Teacher grades manual sections (writing/speaking/scenario) via `review/save.php`
5. Submission status: `pending` → `reviewed` after teacher grades

### Section Types and Grading
| Section | `section_id` | Auto-gradable | Items |
|---------|-------------|--------------|-------|
| Multiple Choice | `mcq` | ✓ yes | `questions[].id` |
| Matching | `matching` | ✓ yes | `exercises[].id` |
| Fill the Blank | `fill_the_blank` | ✓ yes | `questions[].id` |
| Writing | `writing` | ✗ manual | `questions[].id` |
| Speaking | `speaking` | ✗ manual | `questions[].id` |
| Scenario | `scenario` | ✗ manual | `scenarios[].id` |

### Grading Logic (`review/save.php`)
- `teacher_verdict = 'correct'` → score = max_points
- `teacher_verdict = 'wrong'` → score = 0
- `teacher_verdict = null` → use provided `score` value (0 to max_points)
- Auto sections can be overridden to manual via `overrides_json`
- Final: `total_score = effectiveAutoScore + manualScore`

### Delete Rules
- `review/delete.php`: blocked if any submission exists (`submission_count > 0`)
- `teacher/review-delete.php`: force-deletes regardless + unlinks audio files from disk
- Edit (`review/update.php`): blocked if any submission exists

### Publish scheduling
- `publish_at = review_date + publish_time` (via `normalize_publish_at()`)
- If `status = 'published'` but `publish_at > NOW()` → `effective_status = 'scheduled'`
- Notification sent only if `publish_at <= NOW()` at create/update time

---

## 2. Schema JSON Structure

The `schema_json` sent to `create.php` / `update.php`:

```json
{
  "meta": {
    "title_en": "Week 3 Review",
    "title": "مراجعة الأسبوع 3"
  },
  "sections": [
    {
      "section_id": "mcq",
      "title": "Multiple Choice",
      "auto_gradable": true,
      "total_points": 20,
      "points_per_question": 2,
      "questions": [
        {
          "id": "mcq_1",
          "question": "What is the Arabic word for 'book'?",
          "options": { "A": "كتاب", "B": "بيت", "C": "مدرسة", "D": "قلم" },
          "correct": "A",
          "points": 2
        }
      ]
    },
    {
      "section_id": "matching",
      "title": "Matching",
      "auto_gradable": true,
      "total_points": 10,
      "points_per_match": 2,
      "exercises": [
        {
          "id": "match_1",
          "title": "Match the words",
          "left_column": [
            { "id": "L1", "text": "كتاب" },
            { "id": "L2", "text": "بيت" }
          ],
          "right_column": [
            { "id": "R1", "text": "book" },
            { "id": "R2", "text": "house" }
          ],
          "correct_pairs": { "L1": "R1", "L2": "R2" }
        }
      ]
    },
    {
      "section_id": "fill_the_blank",
      "title": "Fill in the Blank",
      "auto_gradable": true,
      "total_points": 10,
      "questions": [
        {
          "id": "ftb_1",
          "sentence_with_blank": "الطالب يقرأ ___",
          "correct_answers": ["كتاباً", "كتابا"],
          "points": 2
        }
      ]
    },
    {
      "section_id": "writing",
      "title": "Writing",
      "auto_gradable": false,
      "total_points": 30,
      "questions": [
        {
          "id": "w_1",
          "prompt": "Write 5 sentences about your daily routine",
          "points": 15,
          "sample_answer": "أنا أستيقظ في الساعة السابعة...",
          "grading_criteria": ["Vocabulary variety", "Grammar accuracy"]
        }
      ]
    },
    {
      "section_id": "speaking",
      "title": "Speaking",
      "auto_gradable": false,
      "total_points": 20,
      "questions": [
        {
          "id": "sp_1",
          "prompt": "Record yourself introducing your family",
          "points": 20,
          "sample_answer": "",
          "grading_criteria": ["Pronunciation", "Fluency"]
        }
      ]
    },
    {
      "section_id": "scenario",
      "title": "Scenario",
      "auto_gradable": false,
      "total_points": 20,
      "scenarios": [
        {
          "id": "sc_1",
          "title": "At the airport",
          "points": 20,
          "expected_steps": [
            { "student_task": "Greet the officer", "points": 5 },
            { "student_task": "State your destination", "points": 5 }
          ]
        }
      ]
    }
  ]
}
```

---

## 3. API Endpoints

### POST `/api/review/create.php`
Creates a review.

**Request fields:**
| Field | Type | Notes |
|-------|------|-------|
| `student_id` | int | required |
| `review_type` | string | `weekly_review` \| `monthly_review` |
| `title` | string | optional — auto-generated from schema `meta.title_en` if empty |
| `review_date` | string | YYYY-MM-DD |
| `publish_time` | string | HH:MM (required if status=published) |
| `status` | string | `draft` \| `published` \| `closed` |
| `schema_json` | string | JSON.stringify of schema object |

**Response:** `{ review_id, title, publish_at, effective_status }`

### POST `/api/review/update.php`
Update review (same shape as create + `review_id`). **Blocked if any submission exists.**

### GET `/api/review/student-list.php?student_id=X`
List all reviews for student (teacher view).

**Response:** `{ items: ReviewListItem[] }`

### POST `/api/review/save.php` (= teacher grading endpoint)
Grade a submission.

**Request fields:**
| Field | Type | Notes |
|-------|------|-------|
| `submission_id` | int | required |
| `teacher_note` | string | optional feedback |
| `scores_json` | string | `JSON.stringify(ManualScoreRow[])` |
| `overrides_json` | string | `JSON.stringify(SectionOverrideRow[])` |

**Response:** `{ submission_id, auto_score, manual_score, total_score, total_points }`

### POST `/api/review/delete.php`
Delete review (blocked if submission exists). Field: `review_id`.

### POST `/api/teacher/review-delete.php`
Force delete review + cascade audio. Field: `id`.

**Delegates:**
- `teacher/review-save.php` → `review/save.php`
- `teacher/student-reviews.php` → `review/student-list.php`

---

## 4. Database Tables

### `student_reviews`
```sql
id, student_id, review_type, title, review_date,
publish_at DATETIME NULL,    -- added by ensure_publish_schedule_support()
status, schema_json, meta_json,
auto_points_total, manual_points_total, total_points,
created_at, updated_at
```

### `student_review_submissions`
```sql
id, review_id, student_id,
answers_json,           -- { mcq: {qid: "A"}, writing: {qid: "..."}, speaking: {qid: "path"} }
auto_breakdown_json,    -- auto-grade results per question
auto_score, manual_score, total_score,
teacher_note, review_status (pending|reviewed),
submitted_at, reviewed_at
UNIQUE KEY (review_id, student_id)
```

### `student_review_manual_scores`
```sql
id, submission_id, section_id, item_id,
max_points, score, teacher_verdict (correct|wrong|NULL), feedback
UNIQUE KEY (submission_id, section_id, item_id)
```

### `student_review_section_overrides`
```sql
id, submission_id, section_id, grading_mode (auto|manual)
UNIQUE KEY (submission_id, section_id)
```

---

## 5. TypeScript Interfaces

```typescript
export type ReviewType = 'weekly_review' | 'monthly_review'
export type ReviewStatus = 'draft' | 'published' | 'closed'
export type EffectiveReviewStatus = 'draft' | 'scheduled' | 'published' | 'closed'
export type SubmissionStatus = 'pending' | 'reviewed'
export type TeacherVerdict = 'correct' | 'wrong'

export interface ReviewListItem {
  id: number
  title: string
  review_type: ReviewType
  review_date: string
  status: ReviewStatus
  total_points: number
  submission_id: number | null
  auto_score: number | null
  manual_score: number | null
  total_score: number | null
  review_status: SubmissionStatus | null
  submitted_at: string | null
}

export interface ManualScoreRow {
  section_id: string
  item_id: string
  max_points: number
  score: number
  teacher_verdict: TeacherVerdict | null
  feedback: string
}

export interface SectionOverrideRow {
  section_id: string
  grading_mode: 'auto' | 'manual'
}

export interface ReviewCreatePayload {
  student_id: number
  review_type: ReviewType
  title?: string
  review_date: string
  publish_time?: string
  status: ReviewStatus
  schema_json: string   // JSON.stringify(ReviewSchema)
}

export interface ReviewUpdatePayload extends ReviewCreatePayload {
  review_id: number
}

export interface ReviewGradePayload {
  submission_id: number
  teacher_note?: string
  scores_json: string   // JSON.stringify(ManualScoreRow[])
  overrides_json: string  // JSON.stringify(SectionOverrideRow[])
}

// Schema types (for builder)
export type SectionId = 'mcq' | 'matching' | 'fill_the_blank' | 'writing' | 'speaking' | 'scenario'

export interface MCQQuestion {
  id: string
  question: string
  options: { A: string; B: string; C?: string; D?: string }
  correct: 'A' | 'B' | 'C' | 'D'
  points: number
}

export interface MatchingExercise {
  id: string
  title: string
  left_column: { id: string; text: string }[]
  right_column: { id: string; text: string }[]
  correct_pairs: Record<string, string>  // { L1: "R2", ... }
}

export interface FillBlankQuestion {
  id: string
  sentence_with_blank: string
  correct_answers: string[]
  points: number
}

export interface WritingQuestion {
  id: string
  prompt: string
  points: number
  sample_answer?: string
  grading_criteria: string[]
}

export interface SpeakingQuestion {
  id: string
  prompt: string
  points: number
  sample_answer?: string
  grading_criteria: string[]
}

export interface ScenarioItem {
  id: string
  title: string
  points: number
  expected_steps: { student_task: string; points: number }[]
}

export interface ReviewSection {
  section_id: SectionId
  title: string
  auto_gradable: boolean
  total_points: number
  points_per_question?: number
  points_per_match?: number
  questions?: (MCQQuestion | FillBlankQuestion | WritingQuestion | SpeakingQuestion)[]
  exercises?: MatchingExercise[]
  scenarios?: ScenarioItem[]
}

export interface ReviewSchema {
  meta: { title_en?: string; title?: string }
  sections: ReviewSection[]
}
```

---

## 6. Frontend Components to Build

### Feature: `roles/teacher/features/reviews/`

```
reviews/
├── index.ts
├── types.ts
├── api.ts
│   ├── getStudentReviews(studentId)
│   ├── createReview(payload)
│   ├── updateReview(payload)
│   ├── gradeReview(payload)
│   └── deleteReview(reviewId)
├── components/
│   ├── ReviewRow.tsx           — row: title, type badge, date, status, score
│   ├── ReviewList.tsx          — list with "New Review" button
│   ├── ReviewCreateDrawer.tsx  — create/edit form (schema builder inside)
│   ├── SchemaBuilder.tsx       — add/remove sections; section sub-forms
│   ├── MCQSectionForm.tsx      — add MCQ questions (question, 4 options, correct)
│   ├── WritingSectionForm.tsx  — add writing prompts + criteria
│   ├── SpeakingSectionForm.tsx — add speaking prompts + criteria
│   └── GradeDrawer.tsx         — grade pending submission
├── StudentReviewsTab.tsx       — full tab component (list + create + grade)
└── README.md
```

---

## 7. Backend Files to Port

| Source | Destination | Type |
|--------|-------------|------|
| `New/Core/api/review/create.php` | `backend/api/review/create.php` | PORT |
| `New/Core/api/review/update.php` | `backend/api/review/update.php` | PORT |
| `New/Core/api/review/save.php` | `backend/api/review/save.php` | PORT |
| `New/Core/api/review/student-list.php` | `backend/api/review/student-list.php` | PORT |
| `New/Core/api/review/delete.php` | `backend/api/review/delete.php` | PORT |
| `New/Core/api/teacher/review-save.php` | `backend/api/teacher/review-save.php` | 1-liner delegate |
| `New/Core/api/teacher/student-reviews.php` | `backend/api/teacher/student-reviews.php` | 1-liner delegate |
| `New/Core/api/teacher/review-delete.php` | `backend/api/teacher/review-delete.php` | PORT |

**All `review/` files:** paths are `../../lib/lib/helpers.php`, `../../config/config/db.php`, `../../lib/lib/review/helpers.php`, `../../lib/lib/learning-audit.php`, `../../lib/lib/notify.php`, `../../lib/lib/push.php`

**Schema fix for `create.php` / `update.php`:** Add `publish_at` to `student_reviews` CREATE TABLE (missing in `ensure_review_tables()`).

---

## 8. Edge Cases

| Case | Handling |
|------|----------|
| `title` empty | Backend auto-generates from `meta.title_en` |
| `publish_at <= NOW()` | Immediate notification + WhatsApp push |
| `publish_at > NOW()` | `effective_status = 'scheduled'`, no notification yet |
| Edit after submission | Backend blocks with 403 "Cannot edit a review after submission" |
| Delete after submission | `review/delete.php` blocks; `teacher/review-delete.php` force-deletes |
| No manual sections | `scores_json = '[]'`, `overrides_json = '[]'` — still valid grade call |
| `teacher_verdict = null` + score > 0 | Partial credit — score taken as-is |
| Auto section overridden to manual | Excluded from auto score; added to manual items list |
| Section has no `auto_gradable` flag | Treated as manual |

---

## 9. Key Constraints

- `schema_json` **must** have `sections` array — `review_decode_schema()` throws if missing
- Section IDs must be exact lowercase: `mcq`, `matching`, `fill_the_blank`, `writing`, `speaking`, `scenario`
- MCQ correct answer must be uppercase: `'A'`, `'B'`, `'C'`, `'D'`
- IDs within a section must be unique strings (e.g. `"mcq_1"`, `"w_1"`) — used as map keys
- `scores_json` / `overrides_json` sent as **JSON strings** (not objects) — use `JSON.stringify()`
- CSRF required on all POST endpoints
- Grading teacher must be `teacher_logged` — NOT `student_id`
- `review/delete.php` uses `review_id`; `teacher/review-delete.php` uses `id` — **different field names**
