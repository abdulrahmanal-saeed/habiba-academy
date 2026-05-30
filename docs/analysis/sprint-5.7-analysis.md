# Sprint 5.7 Analysis — AI Tools (Teacher Side)

## Source Files Analyzed

### Lib Files
- `New/Core/lib/ai-governance.php`
- `New/Core/lib/ai-system.php`
- `New/Core/lib/ai-helpers.php`

### AI Endpoint Files (18 total)
`New/Core/api/teacher/ai/`:
`analyze-student.php`, `homework.php`, `scenario.php`, `lesson.php`, `sessions.php`,
`article.php`, `apply-article.php`, `student-snapshot.php`, `performance-summary.php`,
`review-priority.php`, `feedback-draft.php`, `mistake-tags.php`, `writing-assist.php`,
`suggestion-action.php`, `mistake-event.php`, `internal-note.php`,
`delete-analysis-history.php`, `test-connection.php`

---

## 1. Database Tables (8 AI tables)

Created by `ai_ensure_tables($pdo)` in `ai-system.php`:

| Table | Purpose |
|---|---|
| `ai_settings` | Global settings: api_key, enabled, daily_limit, model, created by `ai_governance_ensure()` |
| `ai_prompt_versions` | Versioned prompts per feature (currently unused in endpoints — reserved) |
| `ai_requests` | Full audit log: every AI call. Columns: `feature_key, student_id, model, input_tokens, output_tokens, cost_fils, applied_at, request_date` |
| `ai_suggestion_actions` | Tracks what teacher did with each AI suggestion: accepted/edited/rejected |
| `mistake_taxonomy` | Seeded list of mistake codes (grammar, vocab, pronunciation, etc.) |
| `student_mistake_events` | Per-student mistake instances with severity + status |
| `teacher_internal_notes` | Private teacher notes per student (general/review/lesson/risk/follow_up) |
| `ai_cache` | SHA256-keyed cache for writing-assist responses (TTL via `created_at`) |
| `student_ai_analysis_history` | Stores full `analyze-student` results for history browsing |

---

## 2. Governance Layer (`ai-governance.php`)

### Core function signature
```php
ai_governance_logged_claude_json(
  $pdo,
  string $featureKey,
  ?int $studentId,
  string $system,
  string $user,
  int $maxTokens,
  string $inputSummary,
  ?int $relatedEntityId = null,
  string $relatedEntityType = ''
): array   // returns ['result' => array, 'request_id' => int]
```

### Flow
1. `ai_governance_ensure($pdo)` — creates `ai_settings` table, seeds defaults
2. Fetch settings: `api_key`, `enabled`, `daily_limit`, `model` (default: `claude-haiku-4-5-20251001`)
3. Rate-limit check: count today's requests for this `feature_key` (or for `student_id` if set)
4. Call Claude API via curl → decode JSON response
5. Log to `ai_requests`: tokens, cost_fils, response snapshot
6. Return `['result' => $decoded, 'request_id' => $insertId]`

### Error codes returned in `result.error`
| Code | Meaning |
|---|---|
| `NO_API_KEY` | `api_key` is empty in `ai_settings` |
| `AI_DISABLED` | `enabled = 0` in `ai_settings` |
| `AI_LIMIT_REACHED` | Daily request count ≥ `daily_limit` for this feature |

### Helper functions
- `ai_governance_ensure($pdo)` — idempotent table + seed
- `ai_governance_test_connection($pdo)` — used by `test-connection.php`
- `ai_governance_get_daily_usage($pdo, $featureKey)` — count today's requests

---

## 3. AI Helpers (`ai-helpers.php`)

| Function | Purpose |
|---|---|
| `get_student_context($pdo, $studentId)` | Fetches student row + recent homework + weak words + mistakes |
| `build_context_text($ctx)` | Formats context array into a readable string for the prompt |
| `claude_chat($apiKey, $model, $system, $user, $maxTokens)` | Raw Claude API call via curl, returns decoded array |
| `strip_json_fences($text)` | Strips ```json ... ``` fences from Claude response |
| `get_level_description($level)` | Maps level code (A1–C2) to Arabic language description |

---

## 4. AI System (`ai-system.php`)

| Function | Purpose |
|---|---|
| `ai_ensure_tables($pdo)` | Creates all 7 tables if not exist |
| `ai_student_snapshot($pdo, $studentId)` | Aggregated student stats: session count, homework stats, avg scores |
| `ai_performance_summary($pdo, $studentId)` | Progress over time: monthly stats, trends |
| `ai_review_priority($pdo, $limit)` | Returns students sorted by review urgency score |
| `ai_cache_get($pdo, $hash)` | Reads from `ai_cache` by SHA256 key |
| `ai_cache_set($pdo, $hash, $response)` | Writes to `ai_cache` |
| `ai_record_suggestion_action($pdo, $data)` | Inserts into `ai_suggestion_actions` |

---

## 5. Endpoint Catalog

### Group A — Governance-based (rate-limited, full logging, Claude API call)

#### `analyze-student.php`
- **Method:** GET
- **Auth:** Teacher session
- **Params:** `?student_id=X`
- **Feature key:** `analyze_student`
- **Max tokens:** 2000
- **Process:** `get_student_context()` → `build_context_text()` → governance call → save to `student_ai_analysis_history`
- **Response:**
```json
{
  "analysis": {
    "summary": "string",
    "strengths": ["string"],
    "weak_areas": ["string"],
    "recommended_focus": "string",
    "homework_recommendation": "string",
    "scenario_recommendation": "string",
    "status": "string"
  },
  "ai_request_id": 123
}
```

#### `homework.php`
- **Method:** POST (JSON body via `php://input`)
- **Auth:** Teacher session + CSRF
- **Body:** `{ student_id, analysis, sections[], lesson_focus, extra_context }`
- **Feature key:** `generate_homework`
- **Max tokens:** 2500
- **Response:**
```json
{
  "homework": {
    "title": "string",
    "listening": "string",
    "reading": "string",
    "mcq": "string",
    "writing": "string",
    "speaking": "string"
  },
  "ai_request_id": 123
}
```

#### `scenario.php`
- **Method:** POST (JSON body)
- **Auth:** Teacher session + CSRF
- **Body:** `{ student_id, analysis, topic, extra_context }`
- **Feature key:** `generate_scenario`
- **Max tokens:** 1500
- **Response:**
```json
{
  "scenario": {
    "title": "string",
    "situation": "string",
    "prompt": "string",
    "time_limit_seconds": 120,
    "keywords": ["string"],
    "model_answer": "string"
  },
  "ai_request_id": 123
}
```

#### `lesson.php`
- **Method:** POST (JSON body)
- **Auth:** Teacher session + CSRF
- **Body:** `{ student_id, analysis, session_number, extra_context }`
- **Feature key:** `prepare_next_lesson`
- **Max tokens:** 3000
- **Response:**
```json
{
  "lesson": {
    "lesson_title": "string",
    "lesson_objective": "string",
    "level_note": "string",
    "warm_up": "string",
    "vocabulary": [{"word": "string", "meaning": "string"}],
    "guided_practice": "string",
    "main_speaking_task": "string",
    "feedback_correction": "string",
    "homework_suggestion": "string",
    "slides_outline": ["string"]
  },
  "ai_request_id": 123
}
```

#### `sessions.php`
- **Method:** GET
- **Auth:** Teacher session
- **Params:** `?student_id, only_empty, count, extra_context`
- **Feature key:** `plan_remaining_sessions`
- **Max tokens:** 2000
- **Response:**
```json
{
  "sessions": [
    {
      "session_number": 1,
      "title": "string",
      "skills": ["string"],
      "goals": "string"
    }
  ],
  "ai_request_id": 123
}
```

#### `article.php`
- **Method:** POST (JSON body)
- **Auth:** Teacher session + CSRF
- **Body:** `{ article_type, audience, keywords, notes, language }`
- **Note:** `student_id = null` — not student-specific
- **Feature key:** `generate_article`
- **Max tokens:** 3000
- **Response:**
```json
{
  "article": {
    "title": "string",
    "slug": "string",
    "seo_meta_title": "string",
    "seo_meta_description": "string",
    "excerpt": "string",
    "body": "string",
    "cta": "string"
  },
  "ai_request_id": 123
}
```

---

### Group B — Data-Only (no Claude API call, no rate limit)

#### `student-snapshot.php`
- **Method:** GET `?student_id=X`
- **Calls:** `ai_student_snapshot($pdo, $studentId)`
- **Response:** `{ snapshot: { ... aggregated stats ... } }`

#### `performance-summary.php`
- **Method:** GET `?student_id=X`
- **Calls:** `ai_performance_summary($pdo, $studentId)`
- **Response:** `{ performance: { ... monthly trends ... } }`

#### `review-priority.php`
- **Method:** GET `?limit=10`
- **Calls:** `ai_review_priority($pdo, $limit)`
- **Response:** `{ items: [{ student_id, full_name, priority_score, reason }] }`

---

### Group C — Rule/Template-Based (no Claude API, but logged as `model='rule-*'`)

#### `feedback-draft.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Fields:** `student_id, strengths_json, issues_json, teacher_note`
- **Model:** `rule-template` (not a real Claude call)
- **Process:** Builds feedback text from strengths/issues arrays using a template
- **Response:** `{ feedback: "string", ai_request_id: 123 }`

#### `mistake-tags.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Fields:** `student_id, text`
- **Model:** `rule-detector`
- **Process:** Heuristic pattern matching against `mistake_taxonomy` rows
- **Response:**
```json
{
  "suggestions": [
    {
      "taxonomy_id": 1,
      "code": "GRAMMAR_AGREEMENT",
      "label_en": "Subject-Verb Agreement",
      "label_ar": "التطابق",
      "confidence": 0.85,
      "reason": "string"
    }
  ],
  "ai_request_id": 123
}
```

---

### Group D — Direct Claude (bypasses governance, uses `claude_chat()` + `ai_cache`)

#### `writing-assist.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Fields:** `student_id, prompt, answer, sample_answer, criteria`
- **Caching:** SHA256(`student_id|prompt|answer`) → `ai_cache` table
- **Graceful fallback:** Returns basic response on Claude failure
- **Response:**
```json
{
  "assist": {
    "summary": "string",
    "possible_issues": ["string"],
    "suggested_feedback": "string",
    "suggested_correction": "string",
    "suggested_tags": ["string"],
    "confidence": 0.9
  },
  "ai_request_id": 123,
  "cached": false
}
```

---

### Group E — Data Actions (no AI call, CRUD only)

#### `apply-article.php`
- **Method:** POST (JSON body)
- **Auth:** Teacher session + CSRF
- **Purpose:** Save AI-generated article draft to `articles` table
- **Requires:** `lib/articles.php`, `lib/learning-audit.php`
- **Process:** Insert article → update `ai_requests.applied_at`
- **Response:** `{ id: 123, slug: "string", message: "Article saved as draft" }`

#### `suggestion-action.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Fields:** `ai_request_id, student_id, feature_key, action (accepted|edited|rejected), original_suggestion, final_value`
- **Calls:** `ai_record_suggestion_action($pdo, $data)`
- **Response:** `{ id: 123 }`

#### `mistake-event.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Fields:** `student_id, taxonomy_id, source_type, source_id, source_question_id, evidence_text, teacher_note, severity, status`
- **Inserts into:** `student_mistake_events`
- **Response:** `{ id: 123 }`

#### `internal-note.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Fields:** `student_id, note_type (general|review|lesson|risk|follow_up), note, ai_generated`
- **Inserts into:** `teacher_internal_notes`
- **Response:** `{ id: 123 }`

#### `delete-analysis-history.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Fields:** `id` (row in `student_ai_analysis_history`)
- **Response:** `{ deleted: true, id: 123 }`

---

### Group F — Utility

#### `test-connection.php`
- **Method:** POST (form data)
- **Auth:** Teacher session + CSRF
- **Calls:** `ai_governance_test_connection($pdo)`
- **Response:** `{ ok: true|false, model: "string", message: "string" }`

---

## 6. TypeScript API Interfaces

```typescript
// features/ai-tools/types.ts

export interface AIAnalysis {
  summary: string
  strengths: string[]
  weak_areas: string[]
  recommended_focus: string
  homework_recommendation: string
  scenario_recommendation: string
  status: string
}

export interface AIHomework {
  title: string
  listening: string
  reading: string
  mcq: string
  writing: string
  speaking: string
}

export interface AIScenario {
  title: string
  situation: string
  prompt: string
  time_limit_seconds: number
  keywords: string[]
  model_answer: string
}

export interface AILesson {
  lesson_title: string
  lesson_objective: string
  level_note: string
  warm_up: string
  vocabulary: Array<{ word: string; meaning: string }>
  guided_practice: string
  main_speaking_task: string
  feedback_correction: string
  homework_suggestion: string
  slides_outline: string[]
}

export interface AISession {
  session_number: number
  title: string
  skills: string[]
  goals: string
}

export interface AIArticle {
  title: string
  slug: string
  seo_meta_title: string
  seo_meta_description: string
  excerpt: string
  body: string
  cta: string
}

export interface AIWritingAssist {
  summary: string
  possible_issues: string[]
  suggested_feedback: string
  suggested_correction: string
  suggested_tags: string[]
  confidence: number
}

export interface MistakeSuggestion {
  taxonomy_id: number
  code: string
  label_en: string
  label_ar: string
  confidence: number
  reason: string
}

export interface StudentSnapshot {
  // Aggregated stats from ai_student_snapshot()
  session_count: number
  homework_completed: number
  avg_score: number
  last_session_date: string | null
}

export interface PerformanceSummary {
  // Monthly trends from ai_performance_summary()
  months: Array<{ month: string; homework_count: number; avg_score: number }>
}

export interface ReviewPriorityItem {
  student_id: number
  full_name: string
  priority_score: number
  reason: string
}

export interface SuggestionActionPayload {
  ai_request_id: number
  student_id: number
  feature_key: string
  action: 'accepted' | 'edited' | 'rejected'
  original_suggestion: string
  final_value: string
}

export interface MistakeEventPayload {
  student_id: number
  taxonomy_id: number
  source_type: string
  source_id?: number
  source_question_id?: string
  evidence_text: string
  teacher_note?: string
  severity?: 'low' | 'medium' | 'high'
  status?: string
}

export interface InternalNotePayload {
  student_id: number
  note_type: 'general' | 'review' | 'lesson' | 'risk' | 'follow_up'
  note: string
  ai_generated?: 0 | 1
}

export type AIErrorCode = 'NO_API_KEY' | 'AI_DISABLED' | 'AI_LIMIT_REACHED'

export interface AIGovernanceError {
  error: AIErrorCode
  message: string
}
```

---

## 7. Backend Files to Create (18 total)

All files go in `backend/api/teacher/ai/`.
All use path prefix `../../../` to reach lib/config.

### Shared header (every file)
```php
<?php
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../config/config/db.php';
require_once __DIR__ . '/../../../lib/lib/ai-governance.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../lib/lib/ai-helpers.php';
```

### File list

| File | Type | Extra requires |
|---|---|---|
| `analyze-student.php` | Governance | — |
| `homework.php` | Governance | — |
| `scenario.php` | Governance | — |
| `lesson.php` | Governance | — |
| `sessions.php` | Governance | — |
| `article.php` | Governance | — |
| `apply-article.php` | Data action | `lib/articles.php`, `lib/learning-audit.php` |
| `student-snapshot.php` | Data-only | — |
| `performance-summary.php` | Data-only | — |
| `review-priority.php` | Data-only | — |
| `feedback-draft.php` | Rule-based | — |
| `mistake-tags.php` | Rule-based | — |
| `writing-assist.php` | Direct Claude | — |
| `suggestion-action.php` | Data action | — |
| `mistake-event.php` | Data action | — |
| `internal-note.php` | Data action | — |
| `delete-analysis-history.php` | Data action | — |
| `test-connection.php` | Utility | — |

---

## 8. Frontend Feature Plan

**Location:** `frontend/src/roles/teacher/features/ai-tools/`

### Components

```
ai-tools/
├── index.ts
├── types.ts
├── api.ts
├── README.md
├── AIAnalysisModal.tsx           ← Already exists in student-detail (reuse/extend)
├── components/
│   ├── AIToolsPanel.tsx          ← Tab switcher: Analysis | Homework | Scenario | Lesson | Article
│   ├── AnalysisTab.tsx           ← Runs analyze-student, shows results, history list
│   ├── HomeworkGeneratorTab.tsx  ← Section checkboxes + lesson_focus + generate → pre-fills HomeworkCreate
│   ├── ScenarioGeneratorTab.tsx  ← Topic input + generate → pre-fills ScenarioCreate
│   ├── LessonPlannerTab.tsx      ← Session # input + generate → inserts into lesson-planning
│   ├── ArticleGeneratorTab.tsx   ← article_type/audience/keywords → generate → apply
│   ├── WritingAssistDrawer.tsx   ← Inline writing feedback helper (used from book-submissions)
│   ├── MistakeTagsInput.tsx      ← Text input → rule-based suggestions → apply tags
│   ├── InternalNoteForm.tsx      ← Quick note form per student
│   └── ReviewPriorityList.tsx    ← Dashboard widget showing priority students
```

### API client (`api.ts`) — grouped calls

```typescript
// Group A: Governance (POST JSON)
analyzeStudent(studentId: number): Promise<{ analysis: AIAnalysis; ai_request_id: number }>
generateHomework(payload): Promise<{ homework: AIHomework; ai_request_id: number }>
generateScenario(payload): Promise<{ scenario: AIScenario; ai_request_id: number }>
prepareLesson(payload): Promise<{ lesson: AILesson; ai_request_id: number }>
planSessions(params): Promise<{ sessions: AISession[]; ai_request_id: number }>
generateArticle(payload): Promise<{ article: AIArticle; ai_request_id: number }>

// Group B: Data-only (GET)
getStudentSnapshot(studentId: number): Promise<{ snapshot: StudentSnapshot }>
getPerformanceSummary(studentId: number): Promise<{ performance: PerformanceSummary }>
getReviewPriority(limit?: number): Promise<{ items: ReviewPriorityItem[] }>

// Group C: Rule-based (POST form)
generateFeedbackDraft(payload): Promise<{ feedback: string; ai_request_id: number }>
getMistakeTags(studentId: number, text: string): Promise<{ suggestions: MistakeSuggestion[]; ai_request_id: number }>

// Group D: Direct Claude (POST form)
getWritingAssist(payload): Promise<{ assist: AIWritingAssist; ai_request_id: number; cached: boolean }>

// Group E: Data actions (POST form)
applyArticle(payload): Promise<{ id: number; slug: string; message: string }>
recordSuggestionAction(payload: SuggestionActionPayload): Promise<{ id: number }>
recordMistakeEvent(payload: MistakeEventPayload): Promise<{ id: number }>
saveInternalNote(payload: InternalNotePayload): Promise<{ id: number }>
deleteAnalysisHistory(id: number): Promise<{ deleted: boolean; id: number }>

// Group F: Utility
testConnection(): Promise<{ ok: boolean; model: string; message: string }>
```

---

## 9. Integration Points

### AIAnalysisModal (already in student-detail)
The existing `AIAnalysisModal.tsx` in `student-detail/components/` already calls `analyze-student.php`. It should:
- Move to `features/ai-tools/` and export from `ai-tools/index.ts`
- Re-import in `student-detail/StudentDetailPage.tsx` from `'../ai-tools'`

### HomeworkCreate pre-fill
`HomeworkGeneratorTab` generates a homework object → on "Use This" button → `navigate('/teacher/homework/create', { state: { prefill: aiHomework } })` → `HomeworkCreatePage` reads `location.state?.prefill` and populates fields.

### LessonPlanning pre-fill
`LessonPlannerTab` generates a lesson plan → on "Insert into Plan" → calls `session-save.php` directly or passes via navigation state to `LessonPlanningPage`.

### ScenarioCreate pre-fill
`ScenarioGeneratorTab` → navigate to scenario create with state.

### BookSubmissions writing assist
`WritingAssistDrawer` is triggered from `SubmissionReviewDrawer` when reviewing a writing task — provides inline suggestions for the writing feedback field.

---

## 10. Key Implementation Rules

1. **NEVER** expose `ANTHROPIC_API_KEY` in frontend — it's stored in `ai_settings.api_key` in the DB, managed exclusively by backend
2. Error codes `NO_API_KEY`, `AI_DISABLED`, `AI_LIMIT_REACHED` must be handled in every AI API call with a user-friendly message
3. All Group A calls return `{ error: AIErrorCode }` in the result when governance blocks — check `'error' in result` before using the payload
4. `writing-assist.php` uses direct `claude_chat()` not governance — it can fail gracefully, returns fallback response
5. POST body for Group A endpoints is JSON (`Content-Type: application/json`, `php://input`) — use `post<T>()` not `postForm<T>()`
6. POST body for Group C/D/E endpoints is form data — use `postForm<T>()`
7. `apply-article.php` requires `lib/articles.php` — the articles table and helpers must exist before building this endpoint
8. `suggestion-action.php` and `mistake-event.php` should be called fire-and-forget (don't block UI on their response)

---

## 11. Path Reference

From `backend/api/teacher/ai/*.php`:

```php
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-governance.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../lib/lib/ai-helpers.php';
require_once __DIR__ . '/../../../config/config/db.php';
// Optional:
require_once __DIR__ . '/../../../lib/lib/articles.php';
require_once __DIR__ . '/../../../lib/lib/learning-audit.php';
```

---

## 12. Sprint 5.7 Build Scope

**Backend (18 files):** Port all 18 PHP files from `New/Core/api/teacher/ai/` to `backend/api/teacher/ai/` with corrected lib paths.

**Frontend:**
- `features/ai-tools/types.ts` — all interfaces from section 6
- `features/ai-tools/api.ts` — all API calls from section 8
- `features/ai-tools/components/AIToolsPanel.tsx` — main container
- `features/ai-tools/components/AnalysisTab.tsx`
- `features/ai-tools/components/HomeworkGeneratorTab.tsx`
- `features/ai-tools/components/ScenarioGeneratorTab.tsx`
- `features/ai-tools/components/LessonPlannerTab.tsx`
- `features/ai-tools/components/ArticleGeneratorTab.tsx`
- `features/ai-tools/components/WritingAssistDrawer.tsx`
- `features/ai-tools/components/MistakeTagsInput.tsx`
- `features/ai-tools/components/InternalNoteForm.tsx`
- `features/ai-tools/components/ReviewPriorityList.tsx`
- `features/ai-tools/index.ts`
- `features/ai-tools/README.md`
- Move `AIAnalysisModal.tsx` from `student-detail/components/` → `ai-tools/components/`
- Add AI Tools route in `roles/teacher/index.tsx` → `/teacher/ai-tools`
