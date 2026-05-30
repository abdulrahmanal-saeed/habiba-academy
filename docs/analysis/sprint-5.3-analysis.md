# Sprint 5.3 Analysis — Lesson Planning + Reviews + Scenarios

## Source Files Analyzed

| Source File | Description |
|------------|-------------|
| `New/Core/api/teacher/lesson-plan-data.php` | GET contract + sessions + stats |
| `New/Core/api/teacher/session-save.php` | POST update session details |
| `New/Core/api/teacher/session-status.php` | POST update session status |
| `New/Core/api/teacher/contract-save.php` | POST create/update contract |
| `New/Core/api/teacher/create-review.php` | Delegates to `api/review/create.php` |

---

## 1. Business Rules

### Contract Structure
- A student has one active contract: `student_contracts` table
- Contract fields: `student_id`, `total_hours`, `session_duration_minutes`, `start_date`, `notes`, `package_name`, `default_price_aed`
- `total_sessions = round(total_hours / (session_duration_minutes / 60))`
- When contract created → auto-generates all session slots 1..totalSessions in `lesson_plan_sessions`
- When contract updated → ONLY adds new slots if `total_sessions` increased; never deletes existing slots
- Default price is 120 AED if not set or 0

### Session Lifecycle
Sessions flow through these statuses (from `lesson_allowed_statuses()`):
- `planned` — default; clears `actual_date`
- `completed` — sets `actual_date` (defaults to today), sets `is_paid = 1`
- `skipped` — no date/pay changes (teacher missed)
- `rescheduled` — updates `planned_date` to new date provided
- `absent` — student no-show: price halved to 50%, `is_paid = 1`, `attendance_note = "No-show. Teacher attended location; half session fee applies."`
- `cancelled` — sets `is_paid = 0`, clears `actual_date`

### Absent = 50% fee
When status = `absent`: `price = price * 0.5`, `is_paid = 1` (half fee charged immediately).

### Skills Tracking
- Skills stored as comma-separated CSV in `lesson_plan_sessions.skills`
- Normalized via `lesson_normalize_skills_csv()` (trims, lowercases, deduplicates)
- `skill_balance` computed from all sessions: `[{ skill, count, pct }]` sorted by frequency descending

### Estimated Finish (`est_finish`)
- Computed from average days between completed sessions
- Extrapolates to estimate completion month for remaining sessions
- Returns `null` if fewer than 2 completed sessions

### Stats Object
Returned by `lesson-plan-data.php` GET:
```
total, done, skipped, absent, cancelled, rescheduled
used_sessions, remaining, pct (progress %)
hours_used, total_hours, hours_per_session
month_sessions, month_hours, month_income
total_income, est_finish (ISO date string | null)
skill_balance: [{ skill, count, pct }]
```

---

## 2. API Endpoints

### GET `/api/teacher/lesson-plan-data.php?student_id=X`
Returns full lesson plan data for a student.

**Response:**
```json
{
  "ok": true,
  "contract": { ...StudentContract },
  "sessions": [ ...LessonPlanSession[] ],
  "stats": { ...LessonPlanStats }
}
```

- Auto-creates `student_contracts` and `lesson_plan_sessions` tables if not exist (self-migrating)
- Returns empty contract shell + empty sessions if none exist yet

### POST `/api/teacher/session-save.php`
Updates a session's details (not status).

**Request fields:** `session_id`, `student_id` (optional — for ownership check), `title`, `planned_date`, `session_time`, `skills` (CSV), `goals`, `teacher_notes`, `is_milestone` (0/1), `milestone_label`

### POST `/api/teacher/session-status.php`
Updates a session's status with business rules applied.

**Request fields:** `session_id`, `status` (one of allowed), `actual_date` (for completed), `planned_date` (for rescheduled)

### POST `/api/teacher/contract-save.php`
Creates or updates a student's contract.

**Request fields:** `student_id`, `total_hours`, `session_duration_minutes`, `start_date`, `notes`, `package_name`, `default_price_aed`

**Behavior:** UPSERT on `student_id`. If new: generates all session slots. If update: only adds slots if total_sessions increased.

### POST `/api/teacher/create-review.php`
Delegates to `api/review/create.php` — creates a review item for a student.

---

## 3. Database Tables

### `student_contracts`
```sql
id, student_id (UNIQUE), total_hours, session_duration_minutes,
start_date, notes, package_name, default_price_aed,
created_at, updated_at
```

### `lesson_plan_sessions`
```sql
id, contract_id, student_id, session_number,
title, subject (default 'Arabic'),
planned_date, planned_time, actual_date, session_time,
duration_minutes, skills (TEXT CSV), goals (TEXT),
teacher_notes (TEXT), attendance_note (TEXT),
status (planned|completed|skipped|rescheduled|absent|cancelled),
is_milestone (TINYINT), milestone_label,
price (DECIMAL), is_paid (TINYINT),
created_at, updated_at
```

---

## 4. TypeScript Interfaces

```typescript
export interface StudentContract {
  id: number
  student_id: number
  total_hours: number
  session_duration_minutes: number
  start_date: string          // YYYY-MM-DD
  notes: string | null
  package_name: string | null
  default_price_aed: number
  created_at: string
  updated_at: string | null
}

export type SessionStatus =
  | 'planned'
  | 'completed'
  | 'skipped'
  | 'rescheduled'
  | 'absent'
  | 'cancelled'

export interface LessonPlanSession {
  id: number
  contract_id: number
  student_id: number
  session_number: number
  title: string | null
  subject: string             // always 'Arabic'
  planned_date: string | null // YYYY-MM-DD
  planned_time: string | null // HH:MM
  actual_date: string | null
  session_time: string | null
  duration_minutes: number
  skills: string | null       // CSV e.g. "grammar,vocabulary"
  goals: string | null
  teacher_notes: string | null
  attendance_note: string | null
  status: SessionStatus
  is_milestone: number        // 0 | 1
  milestone_label: string | null
  price: number
  is_paid: number             // 0 | 1
  created_at: string
  updated_at: string | null
}

export interface SkillBalance {
  skill: string
  count: number
  pct: number                 // 0–100
}

export interface LessonPlanStats {
  total: number
  done: number
  skipped: number
  absent: number
  cancelled: number
  rescheduled: number
  used_sessions: number
  remaining: number
  pct: number                 // 0–100 progress
  hours_used: number
  total_hours: number
  hours_per_session: number
  month_sessions: number
  month_hours: number
  month_income: number
  total_income: number
  est_finish: string | null   // ISO date or null
  skill_balance: SkillBalance[]
}

export interface LessonPlanData {
  contract: StudentContract | null
  sessions: LessonPlanSession[]
  stats: LessonPlanStats
}

// session-save payload
export interface SessionSavePayload {
  session_id: number
  student_id?: number
  title?: string
  planned_date?: string
  session_time?: string
  skills?: string             // comma-separated
  goals?: string
  teacher_notes?: string
  is_milestone?: 0 | 1
  milestone_label?: string
}

// session-status payload
export interface SessionStatusPayload {
  session_id: number
  status: SessionStatus
  actual_date?: string        // required for 'completed'
  planned_date?: string       // required for 'rescheduled'
}

// contract-save payload
export interface ContractSavePayload {
  student_id: number
  total_hours: number
  session_duration_minutes: number
  start_date: string
  notes?: string
  package_name?: string
  default_price_aed: number
}
```

---

## 5. Frontend Components to Build

### Feature: `roles/teacher/features/lesson-planning/`

```
lesson-planning/
├── index.ts
├── types.ts            ← interfaces above
├── api.ts              ← getLessonPlan, saveSession, setSessionStatus, saveContract
├── components/
│   ├── ContractCard.tsx        ← contract summary + edit form
│   ├── StatsCard.tsx           ← progress ring + stats grid
│   ├── SkillBalanceBar.tsx     ← skill frequency bars
│   ├── SessionList.tsx         ← scrollable session list
│   ├── SessionRow.tsx          ← single session row with inline edit
│   ├── SessionStatusMenu.tsx   ← status change dropdown (all 6 statuses)
│   └── SessionEditDrawer.tsx   ← slide-up form: title/date/time/skills/goals/notes/milestone
├── LessonPlanningPage.tsx      ← full page with contract + stats + sessions
└── README.md
```

### API Functions (`api.ts`)

```typescript
getLessonPlan(studentId: number): Promise<LessonPlanData>
saveSession(payload: SessionSavePayload): Promise<ApiOk<{ session: LessonPlanSession }>>
setSessionStatus(payload: SessionStatusPayload): Promise<ApiOk<{ session: LessonPlanSession }>>
saveContract(payload: ContractSavePayload): Promise<ApiOk<{ contract: StudentContract; sessions_added: number }>>
```

---

## 6. Edge Cases

| Case | Handling |
|------|----------|
| No contract yet | Backend returns empty contract shell + `[]` sessions; frontend shows "Setup Contract" prompt |
| Contract hours increased | Backend adds new sessions; never deletes old ones |
| Contract hours decreased | No sessions deleted; teacher manually cancels extras |
| `absent` status | Price immediately halved + `is_paid=1`; cannot undo easily — confirm dialog required |
| Skills CSV | Pass raw comma-separated string to backend; `lesson_normalize_skills_csv()` cleans it server-side |
| `est_finish` null | Show "—" in UI when < 2 completed sessions |
| Session `price = 0` | Backend defaults to `default_price_aed` (or 120 fallback) |
| `planned_date` null | Unscheduled session — shown as "No date set" |

---

## 7. Backend Files to Port

| Source | Destination | Type |
|--------|-------------|------|
| `New/Core/api/teacher/lesson-plan-data.php` | `backend/api/teacher/lesson-plan-data.php` | PORT |
| `New/Core/api/teacher/session-save.php` | `backend/api/teacher/session-save.php` | PORT |
| `New/Core/api/teacher/session-status.php` | `backend/api/teacher/session-status.php` | PORT |
| `New/Core/api/teacher/contract-save.php` | `backend/api/teacher/contract-save.php` | PORT |
| `New/Core/api/teacher/create-review.php` | `backend/api/teacher/create-review.php` | PORT |

All files: fix require paths to `../../lib/lib/helpers.php` and `../../config/config/db.php`.

---

## 8. Route Addition

In `roles/teacher/index.tsx`, add:
```tsx
<Route path="students/:id/lesson-plan" element={<LessonPlanningPage />} />
```

Access from `StudentDetailPage` — add "Lesson Plan" button or tab in the header area.

---

## 9. Key Constraints

- **CSRF required** on all POST endpoints (auto-injected by `apiClient` axios interceptor)
- **`absent` status is destructive** — halves price and marks paid; require confirm dialog
- **Skills are CSV** — split/join on `,` for UI; send raw CSV to backend
- **Session slots never auto-deleted** — UI must handle stale/cancelled slots gracefully
- **`session_number` is display order** — do not re-sequence; gaps are fine
- **No `any` types** — use `SessionStatus` union, not `string`
