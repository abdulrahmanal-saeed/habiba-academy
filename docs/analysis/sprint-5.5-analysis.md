# Sprint 5.5 Analysis — Scenarios + Level Test (Teacher Side)

## File Name Mismatches

| User Reference | Actual Source File | Notes |
|---------------|-------------------|-------|
| `backend/api/teacher/create-scenario.php` | `New/Core/api/teacher/create-scenario.php` | ✓ Correct |
| `backend/api/teacher/level-test-review.php` | **Does NOT exist** | Actual: `leveltest-review-save.php` |

The correct level-test backend file is `New/Core/api/teacher/leveltest-review-save.php`.

---

## 1. Business Rules

### A — Scenarios

Scenarios are speaking-practice tasks the teacher creates per student. The student records an audio response; the teacher reviews recordings.

#### Scenario Lifecycle
1. Teacher creates scenario (`create-scenario.php`) → status `draft | published | closed`
2. If `published && publish_at <= NOW()` → notify student (in-app) + push WhatsApp reminder to teacher
3. Student records response → stored in `scenario_recordings`
4. Teacher views recordings via `student-conversations.php` (already fetched by `ScenariosTab`)

#### Field Rules
| Field | Rules |
|-------|-------|
| `title` | required |
| `sc_date` | required, YYYY-MM-DD |
| `publish_time` | required if `status=published` |
| `publish_at` | computed: `normalize_publish_at(sc_date, publish_time)` |
| `status` | `draft` \| `published` \| `closed` |
| `situation` | optional context text |
| `prompt` | optional instruction text |
| `time_limit` | seconds (default 120 = 2 min) |
| `keywords` | CSV string → split into array → `scenario_keywords` table |
| `model_answer` | optional sample response |

#### Delete Rules (`scenario-delete.php`)
- Deletes audio files from disk for all recordings
- Cascades: `scenario_recordings`, `scenario_keywords`, `scenarios`
- Uses `$_POST['id']` (not `scenario_id`)

---

### B — Level Test Review

The level test has **4 skills**. Listening + Reading are auto-graded by the test itself. Writing + Speaking require teacher grading.

#### Score Breakdown
| Skill | Max | Graded By |
|-------|-----|-----------|
| Listening | 30 | Auto |
| Reading | 25 | Auto |
| Writing | 40 | Teacher |
| Speaking | 80 | Teacher |
| **Total** | **175** | — |

#### Level Calculation (`leveltest-review-save.php`)
```
overall_pct = round((L + R + W + S) / 175 * 100)
<  40%  → A2
< 55%  → B1
< 70%  → B2
< 85%  → C1
>= 85% → C2
```

#### Teacher Grading Flow
1. Teacher loads pending attempt (`review_status = 'pending'`)
2. Submits `writing_score` (0–40) + `speaking_score` (0–80) + `teacher_notes`
3. Backend computes `final_level` from total
4. Sets `review_status = 'reviewed'`, `reviewed_at = NOW()`
5. If `student_id` is set → updates `students.level` automatically
6. Teacher can send result email via `send-result-email.php`

#### Export
- `export-leveltest.php` is a GET endpoint that streams a CSV download directly
- No JSON — just redirect to `GET /api/teacher/export-leveltest.php`

---

### C — Level Test Question Bank

Two sections: `listening` (audio blocks) and `reading` (passage blocks). Each block has multiple question slots. Each slot can have multiple **variants** (randomized per student attempt).

#### Block structure
- `lt_blocks`: `section`, `block_number`, `cefr_level`, `audio_path` (listening) or `passage_ar` (reading)
- `lt_questions`: linked to `block_id`, each with `item_number` + `variant`

#### Key behaviors
- `lt-block-save.php`: `id=0` → INSERT, `id>0` → UPDATE
  - Listening block: requires `audio_path` (from media upload)
  - Reading block: requires `passage_ar`, optional `passage_en`
- `lt-question-save.php`: `id=0` → INSERT next variant, `id>0` → UPDATE
  - Questions: Arabic + optional English; 3–4 options; `correct_opt` uppercase A–D
- `lt-delete.php`: deletes a specific variant; if last variant, deletes the whole slot; re-numbers remaining variants
- `lt-media-upload.php`: **CSRF in POST body** (not header) — special multipart handling
  - `media_type=audio` → `assets/audio/leveltest/` (max 50 MB, MP3/WAV/OGG/WebM/M4A)
  - `media_type=image` → `assets/img/leveltest/` (max 10 MB, JPG/PNG/WEBP)

#### Writing/Speaking Prompt Bank (`lt-prompt-save.php`)
Handles 5 `type` values:

| type | Description | Table |
|------|-------------|-------|
| `writing_bank` | Writing prompts (task1/task2 per CEFR level) | `lt_writing_prompts` |
| `speaking_bank` | Speaking prompts (warmup/description/discussion/abstract) | `lt_speaking_prompts` |
| `writing` | Legacy: save to `site_settings` (`lt_wt1`, `lt_wt2_a2`, …) | `site_settings` |
| `speaking` | Legacy: save to `site_settings` (`lt_sp1_title`, `lt_sp1_bullets`) | `site_settings` |
| `randomization` | Toggle random selection + blocks per level | `site_settings` |

#### Quick Test Blocks (`quick-block-save.php`, `quick-block-delete.php`)
- Simplified test: `lt_quick_blocks` + `lt_quick_questions`
- `questions` field sent as **JSON string** (not separate form fields)
- `quick-block-delete.php`: blocked if only 1 block remains (test must have ≥1)

---

## 2. Database Schema

### `scenarios`
```sql
id, student_id, title, sc_date, publish_at DATETIME NULL, status ENUM('draft','published','closed'),
situation TEXT NULL, prompt TEXT NULL, time_limit_seconds INT DEFAULT 120,
model_answer TEXT NULL, created_at
```

### `scenario_keywords`
```sql
id, scenario_id, keyword VARCHAR(255)
```

### `scenario_recordings`
```sql
id, scenario_id, student_id, take_no, audio_path, submitted_at, teacher_note
```

### `scenario_feedback_chips`
```sql
id, recording_id, feedback_text
```

### `leveltest_attempts`
```sql
id, student_id (NULL for leads), full_name, email, whatsapp, age, country,
applicant_type VARCHAR(50), test_type VARCHAR(50), lead_status VARCHAR(50),
review_status VARCHAR(50) DEFAULT 'pending', current_step VARCHAR(50),
device_id_hash, ip_hash, user_agent_hash,
listening_score INT NULL, reading_score INT NULL,
writing_score INT NULL, speaking_score INT NULL,
auto_score INT NULL, total_score INT NULL,
overall_estimated_level VARCHAR(50), final_level VARCHAR(50),
teacher_notes TEXT NULL, created_at, submitted_at, reviewed_at
```

### `lt_blocks`
```sql
id, section ENUM('listening','reading'), block_number, audio_path VARCHAR(500),
passage_ar MEDIUMTEXT, passage_en MEDIUMTEXT,
cefr_level ENUM('A1','A2','B1','B2','C1','C2'), sort_order, is_active
UNIQUE KEY (section, block_number)
```

### `lt_questions`
```sql
id, block_id, item_number, variant, question_ar, question_en,
opt_a_ar, opt_a_en, opt_b_ar, opt_b_en, opt_c_ar, opt_c_en, opt_d_ar, opt_d_en,
correct_opt CHAR(1), is_active
INDEX (block_id, item_number, variant)
```

### `lt_writing_prompts`
```sql
id, import_key, task_type ENUM('task1','task2'),
cefr_level ENUM('ALL','A2','B1','B2','C1','C2'),
title, prompt_text, diagnostic_notes, word_range, is_active
```

### `lt_speaking_prompts`
```sql
id, import_key, phase ENUM('warmup','description','discussion','abstract'),
target_level, title, prompt_text, bullets JSON, image_path, evaluation_notes, sort_order, is_active
```

### `lt_quick_blocks`
```sql
id, block_number, passage_ar MEDIUMTEXT, sort_order, is_active
UNIQUE KEY (block_number)
```

### `lt_quick_questions`
```sql
id, block_id, q_order, question_ar, opt_a, opt_b, opt_c, opt_d, correct_opt CHAR(1)
```

---

## 3. API Endpoints

### Scenarios

#### POST `/api/teacher/create-scenario.php`
| Field | Type | Notes |
|-------|------|-------|
| `student_id` | int | required |
| `title` | string | required |
| `sc_date` | string | YYYY-MM-DD, required |
| `publish_time` | string | HH:MM, required if published |
| `status` | string | `draft` \| `published` \| `closed` |
| `situation` | string | optional |
| `prompt` | string | optional |
| `time_limit` | int | seconds, default 120 |
| `keywords` | string | CSV, e.g. `"airport, hotel, booking"` |
| `model_answer` | string | optional |

**Response:** `{ scenario_id, title, publish_at, effective_status }`

#### POST `/api/teacher/scenario-delete.php`
| Field | Type |
|-------|------|
| `id` | int |

**Response:** `{}`

#### GET `/api/teacher/student-conversations.php?student_id=X`
Already ported from Sprint 5.2.
**Response:** `{ conversations: ScenarioRecording[] }`

### Level Test Grading

#### POST `/api/teacher/leveltest-review-save.php`
| Field | Type | Notes |
|-------|------|-------|
| `attempt_id` | int | required |
| `writing_score` | int | 0–40 |
| `speaking_score` | int | 0–80 |
| `teacher_notes` | string | optional |

**Response:** `{ attempt_id, total_score, overall_pct, final_level }`

#### POST `/api/teacher/send-result-email.php`
| Field | Type | Notes |
|-------|------|-------|
| `attempt_id` | int | attempt must be `reviewed` and have `email` |

**Response:** `{ sent_to: email }`

#### GET `/api/teacher/export-leveltest.php`
Direct CSV download — no JSON. Use `window.open()` or `<a href>`.

### Level Test Question Bank

#### POST `/api/teacher/lt-block-save.php`
| Field | Type | Notes |
|-------|------|-------|
| `id` | int | 0 = new |
| `section` | string | `listening` \| `reading` |
| `cefr_level` | string | `A1`–`C2` |
| `audio_path` | string | listening only (from media upload) |
| `passage_ar` | string | reading only, required |
| `passage_en` | string | reading only, optional |

**Response:** `{ id, action: 'saved'|'created' }`

#### POST `/api/teacher/lt-question-save.php`
| Field | Type | Notes |
|-------|------|-------|
| `id` | int | 0 = new variant |
| `block_id` | int | required |
| `item_number` | int | question slot (1-based) |
| `question_ar` | string | required |
| `question_en` | string | optional |
| `opt_a_ar` … `opt_d_ar` | string | A–C required; D optional |
| `opt_a_en` … `opt_d_en` | string | optional |
| `correct_opt` | string | `A`\|`B`\|`C`\|`D` |
| `is_active` | checkbox | 1 = active |

**Response (new):** `{ id, variant, action: 'created' }`  
**Response (update):** `{ id, action: 'updated' }`

#### POST `/api/teacher/lt-delete.php`
| Field | Type |
|-------|------|
| `id` | int |

**Response:** `{ deleted: id }`

#### POST `/api/teacher/lt-prompt-save.php`
| Field | Type | Notes |
|-------|------|-------|
| `type` | string | `writing_bank` \| `speaking_bank` \| `randomization` |
| (+ type-specific fields) | | see section 1C above |

#### POST `/api/teacher/lt-media-upload.php` (multipart)
CSRF token must be in POST body field `csrf_token` (not header — multipart/form-data).
| Field | Type |
|-------|------|
| `media_type` | `audio` \| `image` |
| `file` | file upload |

**Response:** `{ path, url }`

#### POST `/api/teacher/quick-block-save.php`
| Field | Type | Notes |
|-------|------|-------|
| `block_id` | int | 0 = new |
| `passage_ar` | string | required |
| `sort_order` | int | |
| `is_active` | int | |
| `questions` | string | `JSON.stringify(QuickQuestion[])` |

**Response:** `{ block_id }`

#### POST `/api/teacher/quick-block-delete.php`
| Field | Type |
|-------|------|
| `block_id` | int |

**Response:** `{}` (blocked if only 1 block remains)

---

## 4. TypeScript Interfaces

```typescript
// ── Scenarios ──────────────────────────────────────────────────────────────

export interface ScenarioCreatePayload {
  student_id: number
  title: string
  sc_date: string
  publish_time?: string
  status: 'draft' | 'published' | 'closed'
  situation?: string
  prompt?: string
  time_limit?: number
  keywords?: string      // CSV string
  model_answer?: string
}

export interface ScenarioRecording {
  id: number
  scenario_id: number
  title: string
  sc_date: string
  take_number: number
  recording_path: string | null
  audio_src: string | null
  submitted_at: string | null
  teacher_note: string | null
  chips: string[]
}

// ── Level Test Attempts ─────────────────────────────────────────────────────

export type LevelTestReviewStatus = 'pending' | 'reviewed'
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface LevelTestAttempt {
  id: number
  student_id: number | null
  full_name: string
  email: string
  whatsapp: string
  age: number | null
  country: string | null
  applicant_type: string
  test_type: string
  lead_status: string
  review_status: LevelTestReviewStatus
  listening_score: number | null
  reading_score: number | null
  writing_score: number | null
  speaking_score: number | null
  auto_score: number | null
  overall_estimated_level: string | null
  final_level: CEFRLevel | null
  teacher_notes: string | null
  created_at: string
  submitted_at: string | null
  reviewed_at: string | null
}

export interface LevelTestGradePayload {
  attempt_id: number
  writing_score: number
  speaking_score: number
  teacher_notes?: string
}

// ── Question Bank ───────────────────────────────────────────────────────────

export type LTSection = 'listening' | 'reading'

export interface LTBlock {
  id: number
  section: LTSection
  block_number: number
  cefr_level: CEFRLevel
  audio_path: string
  passage_ar: string
  passage_en: string
  sort_order: number
  is_active: boolean
  slots: LTQuestionSlot[]
}

export interface LTQuestionSlot {
  item_number: number
  variants: LTQuestion[]
}

export interface LTQuestion {
  id: number
  block_id: number
  item_number: number
  variant: number
  question_ar: string
  question_en: string
  opt_a_ar: string; opt_a_en: string
  opt_b_ar: string; opt_b_en: string
  opt_c_ar: string; opt_c_en: string
  opt_d_ar: string; opt_d_en: string
  correct_opt: 'A' | 'B' | 'C' | 'D'
  is_active: boolean
}

export interface LTBlockSavePayload {
  id: number
  section: LTSection
  cefr_level: CEFRLevel
  audio_path?: string
  passage_ar?: string
  passage_en?: string
}

export interface LTQuestionSavePayload {
  id: number
  block_id: number
  item_number: number
  question_ar: string
  question_en?: string
  opt_a_ar: string; opt_a_en?: string
  opt_b_ar: string; opt_b_en?: string
  opt_c_ar: string; opt_c_en?: string
  opt_d_ar?: string; opt_d_en?: string
  correct_opt: 'A' | 'B' | 'C' | 'D'
  is_active?: number
}

// ── Writing/Speaking Prompts ────────────────────────────────────────────────

export type WritingTaskType = 'task1' | 'task2'
export type SpeakingPhase = 'warmup' | 'description' | 'discussion' | 'abstract'

export interface WritingPrompt {
  id: number
  task_type: WritingTaskType
  cefr_level: CEFRLevel | 'ALL'
  title: string
  prompt_text: string
  diagnostic_notes: string
  word_range: string
  is_active: boolean
}

export interface SpeakingPrompt {
  id: number
  phase: SpeakingPhase
  target_level: string
  title: string
  prompt_text: string
  bullets: string[]
  image_path: string
  evaluation_notes: string
  sort_order: number
  is_active: boolean
}

// ── Quick Test ──────────────────────────────────────────────────────────────

export interface QuickBlock {
  id: number
  block_number: number
  passage_ar: string
  sort_order: number
  is_active: boolean
  questions: QuickQuestion[]
}

export interface QuickQuestion {
  id?: number
  question_ar: string
  opt_a: string
  opt_b: string
  opt_c?: string
  opt_d?: string
  correct_opt: 'A' | 'B' | 'C' | 'D'
}
```

---

## 5. Frontend Components to Build

### Feature: `roles/teacher/features/scenarios/`

```
scenarios/
├── index.ts
├── types.ts
├── api.ts
│   ├── createScenario(payload)
│   ├── deleteScenario(id)
│   └── getStudentConversations(studentId)   ← already called by ScenariosTab Sprint 5.2
├── components/
│   ├── ScenarioRow.tsx           — title, date, status badge, keyword chips
│   ├── ScenarioList.tsx          — list + "New Scenario" button
│   └── ScenarioCreateDrawer.tsx  — create form: title, date, time, status, keywords, prompt, time_limit
├── StudentScenariosTab.tsx       — replaces Sprint 5.2 ScenariosTab: shows list + recordings
└── README.md
```

**Note:** The Sprint 5.2 `ScenariosTab` shows recordings only. Sprint 5.5 enhances it to also show the list of assigned scenarios with a create button. A new endpoint `GET /api/teacher/student-scenarios.php?student_id=X` is needed (not in original — new endpoint).

### Feature: `roles/teacher/features/level-test/`

```
level-test/
├── index.ts
├── types.ts
├── api.ts
│   ├── getLevelTestAttempts()        ← needs new endpoint (list attempts)
│   ├── gradeAttempt(payload)
│   ├── sendResultEmail(attemptId)
│   ├── getExportUrl()               ← returns string URL for CSV download
│   ├── saveBlock(payload)
│   ├── saveQuestion(payload)
│   ├── deleteQuestion(id)
│   ├── savePrompt(payload)
│   ├── uploadMedia(formData)
│   ├── saveQuickBlock(payload)
│   └── deleteQuickBlock(blockId)
├── components/
│   ├── AttemptRow.tsx               — name, date, auto score, status, action
│   ├── AttemptList.tsx              — list with export button + filter (pending/all)
│   ├── GradeAttemptDrawer.tsx       — writing score slider (0–40), speaking slider (0–80), notes, send email
│   ├── BlockEditor.tsx              — list blocks by section, add/edit/toggle
│   ├── QuestionSlotEditor.tsx       — variants per slot: add, toggle, delete
│   └── PromptEditor.tsx             — writing + speaking prompt bank CRUD
├── LevelTestPage.tsx                — 3 tabs: Attempts | Question Bank | Prompts
└── README.md
```

**Route:** Add `/teacher/level-test` to `index.tsx`.

---

## 6. Backend Files to Port

### Scenarios (2 files)

| Source | Destination | Type |
|--------|-------------|------|
| `New/Core/api/teacher/create-scenario.php` | `backend/api/teacher/create-scenario.php` | PORT |
| `New/Core/api/teacher/scenario-delete.php` | `backend/api/teacher/scenario-delete.php` | PORT |

**New endpoint needed:**
| File | Description |
|------|-------------|
| `backend/api/teacher/student-scenarios.php` | NEW — list scenarios for student (id, title, sc_date, status, keyword_count, recording_count) |

### Level Test (9 files)

| Source | Destination | Type |
|--------|-------------|------|
| `New/Core/api/teacher/leveltest-review-save.php` | `backend/api/teacher/leveltest-review-save.php` | PORT |
| `New/Core/api/teacher/send-result-email.php` | `backend/api/teacher/send-result-email.php` | PORT |
| `New/Core/api/teacher/export-leveltest.php` | `backend/api/teacher/export-leveltest.php` | PORT |
| `New/Core/api/teacher/lt-block-save.php` | `backend/api/teacher/lt-block-save.php` | PORT |
| `New/Core/api/teacher/lt-question-save.php` | `backend/api/teacher/lt-question-save.php` | PORT |
| `New/Core/api/teacher/lt-delete.php` | `backend/api/teacher/lt-delete.php` | PORT |
| `New/Core/api/teacher/lt-prompt-save.php` | `backend/api/teacher/lt-prompt-save.php` | PORT |
| `New/Core/api/teacher/lt-media-upload.php` | `backend/api/teacher/lt-media-upload.php` | PORT |
| `New/Core/api/teacher/quick-block-save.php` | `backend/api/teacher/quick-block-save.php` | PORT |
| `New/Core/api/teacher/quick-block-delete.php` | `backend/api/teacher/quick-block-delete.php` | PORT |

**New endpoint needed:**
| File | Description |
|------|-------------|
| `backend/api/teacher/leveltest-attempts.php` | NEW — list all attempts with pagination/filter |
| `backend/api/teacher/leveltest-bank-data.php` | NEW — return all blocks + questions for teacher editor |

**Path fixes:** All files use `../../lib/` and `../../config/` in original. In rebuild: `../../lib/lib/` and `../../config/config/`.

**Special paths for level-test files:**
- `lt-block-save.php`, `lt-question-save.php`, `lt-delete.php`: require `../../lib/lib/leveltest_db.php`
- `lt-prompt-save.php`: requires `../../lib/lib/settings.php` + `../../lib/lib/leveltest_db.php`
- `lt-media-upload.php`: requires `../../lib/lib/settings.php`
- `send-result-email.php`: requires `../../lib/lib/leveltest_bank.php`
- `quick-block-save.php`, `quick-block-delete.php`: require `../../lib/lib/quick_test_db.php`

---

## 7. Edge Cases & Constraints

### Scenarios
| Case | Handling |
|------|----------|
| `publish_at <= NOW()` | Immediate notification + WhatsApp push |
| `publish_at > NOW()` | Scheduled — `effective_status = 'scheduled'` |
| Delete with recordings | Cascades — audio files deleted from disk |
| `keywords` empty string | `explode(',', '')` → `['']` → filter removes it |
| No `student-scenarios.php` | Must create new endpoint for listing |

### Level Test
| Case | Handling |
|------|----------|
| `student_id = NULL` | Lead applicant — no student update on grade |
| `writing_score = 0` + `speaking_score = 0` | Valid — all-zero scores grade as A2 |
| `review_status != 'reviewed'` | `send-result-email.php` blocks with error |
| No email | `send-result-email.php` blocks with error |
| `export-leveltest.php` | Returns CSV binary — not JSON — use `window.open()` |
| `lt-media-upload.php` CSRF | Token in POST body field `csrf_token`, NOT in header |
| Delete last quick block | Blocked: "must have at least one block" |
| Delete last question variant | Hard-deletes slot; if others exist, renumbers remaining |
| `lt-prompt-save.php type=writing` | Uses legacy `site_settings` keys (`lt_wt1`, `lt_wt2_a2`) |
| `lt-prompt-save.php` unknown type | Returns 500 "Unknown type" |
| `quick-block-save.php questions` | Sent as `JSON.stringify(array)` — not form fields |

---

## 8. New Endpoints to Create

### `backend/api/teacher/student-scenarios.php` (NEW)
```
GET ?student_id=X
Returns:
{
  scenarios: [
    {
      id, title, sc_date, publish_at, status, effective_status,
      situation, prompt, time_limit_seconds, model_answer,
      keywords: string[],
      recording_count: number
    }
  ]
}
```

### `backend/api/teacher/leveltest-attempts.php` (NEW)
```
GET ?status=pending|reviewed|all&limit=50&offset=0
Returns:
{
  attempts: LevelTestAttempt[],
  total: number,
  pending_count: number
}
```

### `backend/api/teacher/leveltest-bank-data.php` (NEW)
```
GET (no params)
Returns:
{
  blocks: LTBlock[]   (each block includes slots[].variants[])
}
```
Uses `lt_get_all_for_teacher($pdo)` from `leveltest_db.php`.
