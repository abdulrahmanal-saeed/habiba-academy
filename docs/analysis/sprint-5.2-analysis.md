# Sprint 5.2 — Student Detail + Homework Creation
# PHP Analysis Report

> Source files analyzed:
> - `New/Teacher/Student profiles - details/teacher/student-details.php` (964 lines)
> - `New/Core/api/teacher/create-homework.php` (156 lines)
> - `New/Core/api/teacher/update-homework.php` (152 lines)
> - `New/Core/api/teacher/homework-delete.php` (62 lines)
> - `New/Core/api/teacher/student-submissions.php` (108 lines)
> - `New/Core/api/teacher/student-weak-words.php` (31 lines)
> - `New/Core/api/teacher/student-mistakes.php` (30 lines)
> - `New/Core/api/teacher/student-conversations.php` (33 lines)
> - `New/Core/api/teacher/student-schedule.php` (84 lines)
> - `New/Core/api/teacher/ai/analyze-student.php` (70 lines)

---

## 1. Business Rules

### Student Detail Page

**Quick Stats (server-side computed, 1 GET endpoint):**
- `submitted` = `homework_submissions.is_submitted=1` COUNT + `student_review_submissions` COUNT
- `avg_score` = AVG of (`mcq_score / mcq_total` UNION `total_score / total_points`) × 100, rounded integer
- `recordings` = COUNT of `scenario_recordings` for this student
- `level` = `students.level` field (e.g. "A2")

**7 Tabs in the original page:**
1. **Overview** — Add Weak Word form + Add Mistake form (both POST and reflect immediately)
2. **Submissions** — Lazy-loaded: all homeworks + reviews + scenarios unified, sorted by date DESC
3. **Weak Words** — Lazy-loaded list; mastered words shown last
4. **Mistakes** — Lazy-loaded tag chips; mastered shown last
5. **Scenarios** — Lazy-loaded: recordings with audio player
6. **Materials** — Lazy-loaded: assigned materials table
7. **Schedule** — Lazy-loaded: 7-day fixed weekly schedule with Generate button

**Submission item_type values:** `homework`, `review`, `scenario`
- Homework: shows edit link only if `!is_submitted`; shows delete button always
- Review: read-only (no edit/delete from this page)
- Scenario: read-only (recordings count shown)
- `effective_status`: computed from `status` + `publish_at` + date — can be `draft`, `scheduled`, `published`, `closed`

**Weak Word rule:** `is_active=1` only; ordered by `is_mastered ASC` (unmastered first), then `created_at DESC`

**Mistake rule:** `is_active=1` only; same ordering as weak words

**Schedule rule:** 7 days (0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday); `INSERT ... ON DUPLICATE KEY UPDATE` per day; `duration_minutes` clamped to 15–240; `price_override` nullable

**Generate sessions:** calls `/api/teacher/generate-month-sessions.php`; month param `YYYY-MM`; returns `{ created, updated, skipped_duplicates, skipped_conflicts }`

**AI Analysis:** GET (no CSRF); returns `{ summary, strengths[], weak_areas[], recommended_focus, homework_recommendation, scenario_recommendation, status }` where `status` ∈ `{ on_track, needs_review, needs_support }`

---

### Homework Creation

**Required fields:** `student_id`, `title`, `hw_date`
**Optional fields:** `publish_time`, `media_url`, `media_instructions`, `reading_text`, `mcq_questions[]`, `writing_questions[]`, `speaking_questions[]`

**Status values:** `draft` | `published` | `closed` (default: `draft`)
- `publish_at` = `normalize_publish_at($hw_date, $publish_time)` — combines date + time into DATETIME
- When `status=published` and `publish_at <= NOW()`: triggers push notification to student + WhatsApp nudge to teacher

**MCQ question shape (sent as JSON string):**
```json
{ "question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "a|b|c|d" }
```
- Options C and D are optional (stored as NULL)
- `correct_option` lowercased before storage
- Inserted as `q_order = i + 1`

**Writing question shape:**
```json
{ "prompt": "...", "min_sentences": 3, "focus_area": "..." }
```
- `focus_area` stored as `focus` column, nullable
- `min_sentences` defaults to 3

**Speaking question shape:**
```json
{ "prompt": "...", "time_limit": 60, "tips": "..." }
```
- `time_limit` → `time_limit_seconds` column; defaults to 60
- `tips` nullable

**Transaction:** all inserts wrapped in single `beginTransaction` / `commit` / `rollBack`

**Update rule:** Edit only allowed if `NOT EXISTS (SELECT 1 FROM homework_submissions WHERE homework_id = h.id AND is_submitted = 1)` — i.e. no student has submitted yet. Server returns 404 if already submitted.

**Delete cascade (in order):**
1. `homework_mcq_answers` for all submission IDs
2. `homework_writing_answers` for all submission IDs
3. `homework_speaking_recordings` (also deletes audio files on disk)
4. MCQ / writing / speaking questions
5. `homework_submissions`
6. `homeworks` row

---

## 2. API Endpoints

### Student Detail Data

| Method | Endpoint | Auth | CSRF | Purpose |
|--------|----------|------|------|---------|
| GET | `/api/teacher/student-detail.php?student_id=X` | teacher_logged | — | Quick stats + student profile (NEW — build this) |
| GET | `/api/teacher/student-submissions.php?student_id=X` | teacher_logged | — | All hw+review+scenario items sorted by date |
| GET | `/api/teacher/student-weak-words.php?student_id=X` | teacher_logged | — | Active weak words with mastery status |
| POST | `/api/teacher/save-weak-words.php` | teacher_logged | ✅ | Add a new weak word |
| GET | `/api/teacher/student-mistakes.php?student_id=X` | teacher_logged | — | Active mistake tags with mastery status |
| POST | `/api/teacher/save-mistakes.php` | teacher_logged | ✅ | Add a new mistake tag |
| GET | `/api/teacher/student-conversations.php?student_id=X` | teacher_logged | — | Scenario recordings with audio URLs |
| GET | `/api/teacher/student-materials.php?student_id=X` | teacher_logged | — | Assigned materials |
| GET | `/api/teacher/student-schedule.php?student_id=X` | teacher_logged | — | Weekly fixed schedule (7 slots) |
| POST | `/api/teacher/student-schedule.php` | teacher_logged | ✅ | Save one schedule day (upsert) |
| POST | `/api/teacher/generate-month-sessions.php` | teacher_logged | ✅ | Generate lesson plan sessions for month |
| GET | `/api/teacher/ai/analyze-student.php?student_id=X&extra_context=Y` | teacher_logged | — | AI analysis of student |

### Homework CRUD

| Method | Endpoint | Auth | CSRF | Purpose |
|--------|----------|------|------|---------|
| POST | `/api/teacher/create-homework.php` | teacher_logged | ✅ | Create homework with all sections |
| POST | `/api/teacher/update-homework.php` | teacher_logged | ✅ | Update homework (only if not submitted) |
| POST | `/api/teacher/homework-delete.php` | teacher_logged | ✅ | Delete homework + cascade all data |
| GET | `/api/teacher/students.php` | teacher_logged | — | Active students dropdown (for create form) |

---

## 3. Data Structures

### StudentDetail (frontend TypeScript shape)

```typescript
interface StudentDetail {
  id: number
  full_name: string
  login_code: string
  level: string
  is_active: boolean
  last_seen: string | null
  // Quick stats
  submitted_count: number    // hw + review submissions
  avg_score: number          // integer 0-100
  recordings_count: number
}
```

### SubmissionItem

```typescript
interface SubmissionItem {
  id: number
  item_type: 'homework' | 'review' | 'scenario'
  title: string
  hw_date: string            // formatted d/m/Y
  sort_at: string
  status: 'draft' | 'published' | 'closed'
  effective_status: 'draft' | 'scheduled' | 'published' | 'closed'
  is_submitted: boolean
  mcq_score: number
  mcq_total: number
  submitted_at: string | null
  teacher_note?: string | null
  review_status?: string | null
  recordings_count?: number   // scenarios only
}
```

### WeakWord

```typescript
interface WeakWord {
  id: number
  word: string
  note: string | null
  created_at: string
  is_mastered: number        // 0 | 1
  mastered_at: string | null
  guidance: string           // from PHP lib
}
```

### Mistake

```typescript
interface Mistake {
  id: number
  mistake_tag: string
  note: string | null
  created_at: string
  is_mastered: number        // 0 | 1
  guidance: string           // from PHP lib
}
```

### ScenarioRecording

```typescript
interface ScenarioRecording {
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
```

### ScheduleSlot

```typescript
interface ScheduleSlot {
  id: number
  student_id: number
  day_of_week: number        // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
  session_time: string       // "HH:MM:SS"
  duration_minutes: number
  price_override: number | null   // AED
  is_active: number          // 0 | 1
  updated_at: string | null
}
```

### AIAnalysis

```typescript
interface AIAnalysis {
  summary: string
  strengths: string[]
  weak_areas: string[]
  recommended_focus: string
  homework_recommendation: string
  scenario_recommendation: string
  status: 'on_track' | 'needs_review' | 'needs_support'
}
```

### MCQQuestion / WritingQuestion / SpeakingQuestion (create payload)

```typescript
interface MCQQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c?: string
  option_d?: string
  correct_option: 'a' | 'b' | 'c' | 'd'
}

interface WritingQuestion {
  prompt: string
  min_sentences: number    // default 3
  focus_area?: string
}

interface SpeakingQuestion {
  prompt: string
  time_limit: number       // seconds, default 60
  tips?: string
}

interface HomeworkPayload {
  student_id: number
  title: string
  hw_date: string          // YYYY-MM-DD
  publish_time?: string    // HH:MM
  status: 'draft' | 'published' | 'closed'
  media_url?: string
  media_instructions?: string
  reading_text?: string
  mcq_questions: MCQQuestion[]
  writing_questions: WritingQuestion[]
  speaking_questions: SpeakingQuestion[]
}

interface HomeworkCreatedResponse {
  homework_id: number
  title: string
  publish_at: string | null
  effective_status: string
}
```

---

## 4. Edge Cases

### Student Detail
- Student ID 0 or invalid → PHP redirects to students list; frontend must validate before fetch
- Avg score is NULL in DB if no scored submissions → PHP returns 0 via `round((float)null)` = 0; treat 0 as "no data" only if `submitted_count === 0`
- Materials tab links out to `/teacher/materials.php` for editing — in React this will just be a route link to future materials feature
- AI analysis is a GET with no CSRF — can fail due to API quota; show graceful error

### Homework Create
- `publish_at` is computed server-side from `hw_date + publish_time`; if status=published and `publish_at` is invalid → server returns 400
- Update endpoint silently rejects if any submission exists: returns 404; frontend must handle as "cannot edit, already submitted"
- Delete permanently removes audio files from disk — irreversible; requires confirm dialog
- Sections are fully optional: a homework with title + date only (no sections) is valid
- Option C and D can be empty string — sent as empty string, stored as NULL
- MCQ `correct_option` is auto-lowercased server-side; frontend can send `'A'` but server will lowercase it
- `publish_time` defaults to current time in original UI — React form should do the same

### Schedule
- Day of week mapping: 0=Saturday, NOT 0=Sunday (different from JS `Date.getDay()` which is 0=Sunday)
- If a day has never been saved, it won't appear in GET response — frontend must build all 7 slots from scratch, filling missing days with defaults (`session_time: '16:00'`, `duration_minutes: 60`, `is_active: 0`)
- Generate sessions: server skips duplicates silently — safe to call multiple times

### Weak Words / Mistakes
- Both use `is_active=1` — deleted items are soft-deleted (set is_active=0)
- Guidance field comes from PHP lib (`weak_word_guidance()`, `common_mistake_guidance()`) — treat as read-only display string

---

## 5. Files To Build

### Backend (new endpoint needed — 1 file)

| File | Purpose |
|------|---------|
| `backend/api/teacher/student-detail.php` | GET: student profile + quick stats (submitted, avg_score, recordings_count) |

> All other student-detail tab endpoints (`student-submissions.php`, `student-weak-words.php`, `student-mistakes.php`, `student-conversations.php`, `student-schedule.php`) already exist in `New/Core/api/teacher/` and need to be **ported** (copied + session check updated to `teacher_logged`). Similarly for `create-homework.php`, `update-homework.php`, `homework-delete.php`.

**Backend files to port (copy from Core + update session check):**

| Source | Destination |
|--------|-------------|
| `New/Core/api/teacher/student-submissions.php` | `backend/api/teacher/student-submissions.php` |
| `New/Core/api/teacher/student-weak-words.php` | `backend/api/teacher/student-weak-words.php` |
| `New/Core/api/teacher/student-mistakes.php` | `backend/api/teacher/student-mistakes.php` |
| `New/Core/api/teacher/student-conversations.php` | `backend/api/teacher/student-conversations.php` |
| `New/Core/api/teacher/student-schedule.php` | `backend/api/teacher/student-schedule.php` |
| `New/Core/api/teacher/generate-month-sessions.php` | `backend/api/teacher/generate-month-sessions.php` |
| `New/Core/api/teacher/create-homework.php` | `backend/api/teacher/create-homework.php` |
| `New/Core/api/teacher/update-homework.php` | `backend/api/teacher/update-homework.php` |
| `New/Core/api/teacher/homework-delete.php` | `backend/api/teacher/homework-delete.php` |

> `save-weak-words.php` and `save-mistakes.php` also need to be ported — check if they exist in Core.

### Frontend (18 files)

#### Student Detail feature (`roles/teacher/features/student-detail/`)

| File | Contents |
|------|---------|
| `types.ts` | `StudentDetail`, `SubmissionItem`, `WeakWord`, `Mistake`, `ScenarioRecording`, `ScheduleSlot`, `AIAnalysis` |
| `api.ts` | `getStudentDetail(id)`, `getSubmissions(id)`, `getWeakWords(id)`, `addWeakWord(id, word, note)`, `getMistakes(id)`, `addMistake(id, tag)`, `getConversations(id)`, `getMaterials(id)`, `getSchedule(id)`, `saveScheduleDay(...)`, `generateMonthSessions(id, month)`, `analyzeStudent(id, extra)` |
| `StudentDetailPage.tsx` | Header (avatar, stats, action buttons) + 7-tab shell; routes to sub-pages |
| `components/StatBar.tsx` | 4 quick-stat chips: Submitted / Avg Score / Recordings / Level |
| `components/SubmissionsTab.tsx` | Table of all work items; delete button with confirm for homework |
| `components/WeakWordsTab.tsx` | Card grid of weak words with mastery badge; add-word form |
| `components/MistakesTab.tsx` | Tag chips with mastery state; add-mistake form |
| `components/ScenariosTab.tsx` | Recording cards with `<audio>` player |
| `components/MaterialsTab.tsx` | Table of assigned materials (read-only from this page) |
| `components/ScheduleTab.tsx` | 7 schedule rows + Generate Sessions sub-form |
| `components/OverviewTab.tsx` | Add-word + Add-mistake quick-entry forms |
| `components/AIAnalysisModal.tsx` | Modal with 6-field analysis display + re-analyze button |
| `index.ts` | Exports |
| `README.md` | Feature docs |

#### Homework Create feature (`roles/teacher/features/homework-create/`)

| File | Contents |
|------|---------|
| `types.ts` | `MCQQuestion`, `WritingQuestion`, `SpeakingQuestion`, `HomeworkPayload`, `HomeworkCreatedResponse` |
| `api.ts` | `createHomework(payload)`, `updateHomework(homeworkId, payload)`, `getActiveStudents()` |
| `HomeworkCreatePage.tsx` | Main form shell: student selector + date + status + 4 section cards + save button |
| `components/MCQSection.tsx` | Dynamic MCQ list; add/remove questions; A-D inputs + correct option select |
| `components/WritingSection.tsx` | Dynamic writing prompts; prompt + min_sentences + focus_area |
| `components/SpeakingSection.tsx` | Dynamic speaking prompts; prompt + time_limit + tips |
| `components/ListeningSection.tsx` | Media URL + instructions textarea |
| `index.ts` | Exports |
| `README.md` | Feature docs |

### Router updates

- `/teacher/students/:id` → `StudentDetailPage`
- `/teacher/homework/create` → `HomeworkCreatePage` (optionally `?student_id=X` pre-selects)
- Both inside `TeacherLayout`, behind `AuthGuard role="teacher"`

---

## Summary of Complexity

| Area | Complexity | Reason |
|------|-----------|--------|
| Student Detail page | High | 7 tabs, 9 API calls, lazy loading per tab, AI modal |
| Homework Create | Medium | 4 dynamic section builders, JSON serialization of questions |
| Homework Update | Low | Same form re-used; only difference is `homework_id` and blocked if submitted |
| Schedule tab | Medium | 7-slot day grid, upsert per row, generate-month action |
| Backend porting | Low | Mostly copy + session check update |

**Sprint scope recommendation:** Build StudentDetailPage with first 3 tabs (Overview, Submissions, Schedule) + HomeworkCreatePage in Sprint 5.2. Defer WeakWords/Mistakes/Scenarios/Materials tabs and AIAnalysisModal to Sprint 5.3 to keep sprint size manageable.
