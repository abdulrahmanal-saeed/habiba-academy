# Sprint 7.1 Analysis — Parent Role: Dashboard + Child Homework + Child Progress

## Source Files Read

| New file | Source reference |
|----------|-----------------|
| `backend/api/parent/home.php` | `New/Parent/Parent dashboard/parent/dashboard.php` |
| `backend/api/parent/child-homework.php` | `New/Parent/Child homework/parent/child-homework.php` |
| `backend/api/parent/child-progress.php` | `New/Parent/Child progress/parent/child-progress.php` |

**Helper source files:**
- `New/Parent/Parent dashboard/parent/_guard.php` — session auth pattern
- `New/Parent/Parent dashboard/parent/_portal.php` — 6 helper functions

---

## Auth Pattern (CRITICAL — differs from teacher/owner)

Parent API uses **session-based auth** with `$_SESSION['parent_id']`, NOT `require_teacher()`:

```php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';

start_session();
if (empty($_SESSION['parent_id'])) {
    json_err('Not authenticated', 401);
}
$parent_id = (int)$_SESSION['parent_id'];
portals_ensure_schema($pdo);
```

**Lib path:** Double-nested (same as owner): `require_once __DIR__ . '/../../lib/lib/helpers.php'`

**Directory:** `backend/api/parent/` does NOT exist yet — must be created.

---

## Helper Functions (from `_portal.php`)

### `parent_linked_students(PDO $pdo, int $parentId): array`
```sql
SELECT s.id, s.full_name, s.login_code, s.level, s.is_active
FROM parent_students ps
JOIN students s ON s.id = ps.student_id
WHERE ps.parent_contact_id = :pid AND s.status = 'active'
ORDER BY s.full_name
```
Returns: `[{id, full_name, login_code, level, is_active}]`

### `parent_require_child(PDO $pdo, int $parentId, int $studentId): array`
```sql
SELECT s.* FROM parent_students ps
JOIN students s ON s.id = ps.student_id
WHERE ps.parent_contact_id = :pid AND ps.student_id = :sid
```
If no row: `json_err('Access denied', 403)` (we use json_err instead of http_response_code in REST API).
Returns the student row.

### `parent_child_balance(PDO $pdo, int $studentId): array`
Calls `lesson_package_balances($pdo, [$studentId])` and returns `$balances[$studentId]`.
Returns: `{package_name, contract_sessions, completed_sessions, planned_sessions, remaining_sessions, expiry_date, ...}`

### `parent_child_upcoming(PDO $pdo, array $studentIds, int $limit = 12): array`
```sql
SELECT lps.id, lps.student_id, s.full_name AS student_name,
       lps.planned_date, lps.planned_time, lps.duration_minutes,
       lps.status, lps.goals
FROM lesson_plan_sessions lps
JOIN students s ON s.id = lps.student_id
WHERE lps.student_id IN (...) 
  AND lps.planned_date >= CURDATE()
  AND lps.status IN ('planned','rescheduled')
ORDER BY lps.planned_date, lps.planned_time
LIMIT :limit
```
Returns: `[{id, student_id, student_name, planned_date, planned_time, duration_minutes, status, goals}]`

### `parent_child_homework(PDO $pdo, int $studentId, int $limit = 20): array`
```sql
SELECT h.id, h.title, h.status AS hw_status, h.hw_date, h.publish_at,
       COALESCE(hs.is_submitted, 0) AS submitted,
       hs.submitted_at
FROM homeworks h
LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = :sid
WHERE h.student_id = :sid
ORDER BY COALESCE(h.publish_at, h.hw_date) DESC
LIMIT 30
```
Returns: `[{id, title, hw_status, hw_date, publish_at, submitted, submitted_at}]`

### `parent_child_session_notes(PDO $pdo, int $studentId, int $limit = 20): array`
```sql
SELECT id, planned_date, teacher_notes, goals, status
FROM lesson_plan_sessions
WHERE student_id = :sid
  AND (teacher_notes <> '' OR goals <> '' OR status = 'completed')
ORDER BY planned_date DESC
LIMIT :limit
```
Returns: `[{id, planned_date, teacher_notes, goals, status}]`

---

## Backend API Specs

### 1. `GET /api/parent/home`

**Source:** `New/Parent/Parent dashboard/parent/dashboard.php`

**Logic:**
1. Auth via `$_SESSION['parent_id']`
2. `portals_ensure_schema($pdo)`
3. Get parent name: `SELECT full_name FROM parent_contacts WHERE id = :pid`
4. `$students = parent_linked_students($pdo, $parent_id)`
5. `$studentIds = array_column($students, 'id')`
6. `$upcoming = parent_child_upcoming($pdo, $studentIds, 12)`
7. For each student: attach `balance = parent_child_balance($pdo, $student['id'])`
8. KPIs: `student_count = count($students)`, `upcoming_count = count($upcoming)`

**Response:**
```json
{
  "ok": true,
  "data": {
    "parent": { "full_name": "..." },
    "students": [
      {
        "id": 1,
        "full_name": "...",
        "login_code": "...",
        "level": "...",
        "balance": {
          "package_name": "...",
          "completed_sessions": 10,
          "remaining_sessions": 5,
          "contract_sessions": 15
        }
      }
    ],
    "upcoming": [
      {
        "id": 1,
        "student_id": 1,
        "student_name": "...",
        "planned_date": "2026-05-22",
        "planned_time": "10:00:00",
        "duration_minutes": 60,
        "status": "planned",
        "goals": "..."
      }
    ],
    "kpis": {
      "student_count": 2,
      "upcoming_count": 5
    }
  }
}
```

---

### 2. `GET /api/parent/child-homework?id=N`

**Source:** `New/Parent/Child homework/parent/child-homework.php`

**Logic:**
1. Auth via `$_SESSION['parent_id']`
2. `$child_id = (int)($_GET['id'] ?? 0)` — 400 if missing
3. `$child = parent_require_child($pdo, $parent_id, $child_id)` — 403 if not parent's child
4. `$homework = parent_child_homework($pdo, $child_id, 30)`

**Response:**
```json
{
  "ok": true,
  "data": {
    "child": {
      "id": 1,
      "full_name": "...",
      "login_code": "...",
      "level": "..."
    },
    "homework": [
      {
        "id": 10,
        "title": "...",
        "hw_status": "active",
        "hw_date": "2026-05-20",
        "publish_at": "2026-05-18 08:00:00",
        "submitted": 1,
        "submitted_at": "2026-05-19 14:30:00"
      }
    ]
  }
}
```

---

### 3. `GET /api/parent/child-progress?id=N`

**Source:** `New/Parent/Child progress/parent/child-progress.php`

**Logic:**
1. Auth via `$_SESSION['parent_id']`
2. `$child_id = (int)($_GET['id'] ?? 0)` — 400 if missing
3. `$child = parent_require_child($pdo, $parent_id, $child_id)` — 403 if not parent's child
4. `$balance = parent_child_balance($pdo, $child_id)`

**Response:**
```json
{
  "ok": true,
  "data": {
    "child": {
      "id": 1,
      "full_name": "...",
      "level": "..."
    },
    "balance": {
      "package_name": "Gold Package",
      "contract_sessions": 20,
      "completed_sessions": 8,
      "planned_sessions": 3,
      "remaining_sessions": 9,
      "expiry_date": "2026-08-01"
    }
  }
}
```

---

## Frontend TypeScript Types

### `frontend/src/roles/parent/features/dashboard/types.ts`
```typescript
export interface ParentBalance {
  package_name: string | null
  contract_sessions: number
  completed_sessions: number
  planned_sessions: number
  remaining_sessions: number
  expiry_date: string | null
}

export interface ParentStudent {
  id: number
  full_name: string
  login_code: string
  level: string
  balance: ParentBalance
}

export interface UpcomingSession {
  id: number
  student_id: number
  student_name: string
  planned_date: string
  planned_time: string
  duration_minutes: number
  status: 'planned' | 'rescheduled'
  goals: string
}

export interface ParentHomeData {
  parent: { full_name: string }
  students: ParentStudent[]
  upcoming: UpcomingSession[]
  kpis: { student_count: number; upcoming_count: number }
}
```

### `frontend/src/roles/parent/features/child-homework/types.ts`
```typescript
export interface HomeworkItem {
  id: number
  title: string
  hw_status: string
  hw_date: string
  publish_at: string | null
  submitted: 0 | 1
  submitted_at: string | null
}

export interface ChildHomeworkData {
  child: { id: number; full_name: string; login_code: string; level: string }
  homework: HomeworkItem[]
}
```

### `frontend/src/roles/parent/features/child-progress/types.ts`
```typescript
export interface ChildBalance {
  package_name: string | null
  contract_sessions: number
  completed_sessions: number
  planned_sessions: number
  remaining_sessions: number
  expiry_date: string | null
}

export interface ChildProgressData {
  child: { id: number; full_name: string; level: string }
  balance: ChildBalance
}
```

---

## Frontend API Functions

### `dashboard/api.ts`
```typescript
import { apiClient } from '@/core/lib/apiClient'
import type { ParentHomeData } from './types'

export const fetchParentHome = (): Promise<ParentHomeData> =>
  apiClient.get<{ parent: ParentHomeData['parent']; students: ParentHomeData['students']; upcoming: ParentHomeData['upcoming']; kpis: ParentHomeData['kpis'] }>('/api/parent/home')
    .then((r) => r.data)
```

### `child-homework/api.ts`
```typescript
import { apiClient } from '@/core/lib/apiClient'
import type { ChildHomeworkData } from './types'

export const fetchChildHomework = (childId: number): Promise<ChildHomeworkData> =>
  apiClient.get<ChildHomeworkData>(`/api/parent/child-homework?id=${childId}`)
    .then((r) => r.data)
```

### `child-progress/api.ts`
```typescript
import { apiClient } from '@/core/lib/apiClient'
import type { ChildProgressData } from './types'

export const fetchChildProgress = (childId: number): Promise<ChildProgressData> =>
  apiClient.get<ChildProgressData>(`/api/parent/child-progress?id=${childId}`)
    .then((r) => r.data)
```

---

## Frontend Hooks

### `dashboard/hooks/useParentHome.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchParentHome } from '../api'

export const useParentHome = () =>
  useQuery({ queryKey: ['parent-home'], queryFn: fetchParentHome, staleTime: 30_000 })
```

### `child-homework/hooks/useChildHomework.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchChildHomework } from '../api'

export const useChildHomework = (childId: number) =>
  useQuery({
    queryKey: ['child-homework', childId],
    queryFn: () => fetchChildHomework(childId),
    enabled: childId > 0,
    staleTime: 10_000,
  })
```

### `child-progress/hooks/useChildProgress.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchChildProgress } from '../api'

export const useChildProgress = (childId: number) =>
  useQuery({
    queryKey: ['child-progress', childId],
    queryFn: () => fetchChildProgress(childId),
    enabled: childId > 0,
    staleTime: 30_000,
  })
```

---

## Frontend Component Structure

### Dashboard (`/parent`)

```
features/dashboard/
├── types.ts
├── api.ts
├── animations.ts
├── hooks/
│   └── useParentHome.ts
├── components/
│   ├── ParentKPIStrip.tsx       — 2 KPIs: Students + Upcoming sessions
│   ├── StudentBalanceCard.tsx   — Per student: name + level + balance KPIs (completed/remaining/package)
│   └── UpcomingSessionsList.tsx — List of upcoming sessions with date/time/student name/goals
├── ParentDashboardPage.tsx      — Composes all, handles loading/error
├── index.ts
└── README.md
```

**ParentDashboardPage layout:**
- Header: "مرحبا {parent.full_name}" + KPI strip (2 cards)
- Student cards grid (one per linked child): name, level badge, balance bar
- Upcoming sessions list (sorted by date)
- Each student card links to `/parent/children/{id}/homework` and `/parent/children/{id}/progress`

### Child Homework (`/parent/children/:id/homework`)

```
features/child-homework/
├── types.ts
├── api.ts
├── animations.ts
├── hooks/
│   └── useChildHomework.ts
├── components/
│   ├── HomeworkStatusBadge.tsx  — submitted (success) / awaiting (warning)
│   └── HomeworkList.tsx         — animated list of homework items
├── ChildHomeworkPage.tsx        — Gets :id from useParams, fetches + renders
├── index.ts
└── README.md
```

**ChildHomeworkPage layout:**
- Back button to `/parent`
- Child header: name + level + login_code badge
- Homework list (newest first): title + date + status badge (Submitted/Awaiting)
- submitted_at shown if submitted

### Child Progress (`/parent/children/:id/progress`)

```
features/child-progress/
├── types.ts
├── api.ts
├── animations.ts
├── hooks/
│   └── useChildProgress.ts
├── components/
│   └── BalanceKPIStrip.tsx      — 3 KPIs: Level, Completed, Remaining + package name + expiry
├── ChildProgressPage.tsx        — Gets :id from useParams, fetches + renders
├── index.ts
└── README.md
```

**ChildProgressPage layout:**
- Back button to `/parent`
- Child header: name + level
- Package name + expiry date
- KPI strip: Completed Sessions | Remaining Sessions | Contract Sessions
- Progress bar: completed / contract_sessions

---

## Parent Router

```
frontend/src/roles/parent/
├── index.tsx          ← ParentApp router
├── components/
│   └── ParentLayout.tsx
└── features/
    ├── dashboard/
    ├── child-homework/
    └── child-progress/
```

### `frontend/src/roles/parent/index.tsx`
```tsx
import { Routes, Route } from 'react-router-dom'
import { ParentLayout } from './components/ParentLayout'
import { ParentDashboardPage } from './features/dashboard'
import { ChildHomeworkPage } from './features/child-homework'
import { ChildProgressPage } from './features/child-progress'

const ParentApp: FC = () => (
  <ParentLayout>
    <Routes>
      <Route index element={<ParentDashboardPage />} />
      <Route path="children/:id/homework" element={<ChildHomeworkPage />} />
      <Route path="children/:id/progress" element={<ChildProgressPage />} />
    </Routes>
  </ParentLayout>
)
```

---

## Backend File Templates

### `backend/api/parent/home.php`
```php
<?php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';

start_session();
if (empty($_SESSION['parent_id'])) json_err('Not authenticated', 401);
$parent_id = (int)$_SESSION['parent_id'];
portals_ensure_schema($pdo);

$stmt = $pdo->prepare('SELECT full_name FROM parent_contacts WHERE id = ?');
$stmt->execute([$parent_id]);
$parent = $stmt->fetch() ?: ['full_name' => ''];

$students = parent_linked_students($pdo, $parent_id);
$student_ids = array_column($students, 'id');
$upcoming = $student_ids ? parent_child_upcoming($pdo, $student_ids, 12) : [];

foreach ($students as &$s) {
    $s['balance'] = parent_child_balance($pdo, $s['id']);
}
unset($s);

json_ok([
    'parent'   => $parent,
    'students' => $students,
    'upcoming' => $upcoming,
    'kpis'     => ['student_count' => count($students), 'upcoming_count' => count($upcoming)],
]);
```

### `backend/api/parent/child-homework.php`
```php
<?php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';

start_session();
if (empty($_SESSION['parent_id'])) json_err('Not authenticated', 401);
$parent_id = (int)$_SESSION['parent_id'];
portals_ensure_schema($pdo);

$child_id = (int)($_GET['id'] ?? 0);
if (!$child_id) json_err('Missing child id', 400);

$child = parent_require_child($pdo, $parent_id, $child_id);
$homework = parent_child_homework($pdo, $child_id, 30);

json_ok(['child' => $child, 'homework' => $homework]);
```

### `backend/api/parent/child-progress.php`
```php
<?php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';

start_session();
if (empty($_SESSION['parent_id'])) json_err('Not authenticated', 401);
$parent_id = (int)$_SESSION['parent_id'];
portals_ensure_schema($pdo);

$child_id = (int)($_GET['id'] ?? 0);
if (!$child_id) json_err('Missing child id', 400);

$child = parent_require_child($pdo, $parent_id, $child_id);
$balance = parent_child_balance($pdo, $child_id);

json_ok(['child' => $child, 'balance' => $balance]);
```

---

## Key Notes

1. **No `require_teacher()`** — parent auth is pure session check: `if (empty($_SESSION['parent_id']))`
2. **`parent_require_child` security** — every child endpoint MUST call this; never trust `$_GET['id']` alone
3. **`portals_ensure_schema`** — must be called on every parent API request (creates tables if missing)
4. **`lesson_package_balances`** needs `lesson-schedule.php` — include it in home.php and child-progress.php
5. **`parent_linked_students`** and all helper functions live in `roles-portals.php` — include it everywhere
6. **Directory does not exist** — `backend/api/parent/` must be created
7. **Lib path double-nested** — `require_once __DIR__ . '/../../lib/lib/helpers.php'`
8. **Route pattern** — child pages at `/parent/children/:id/homework` and `/parent/children/:id/progress`
9. **`useParams`** — ChildHomeworkPage and ChildProgressPage read `:id` from URL params
10. **ParentLayout** — minimal layout with back-navigation; no complex sidebar needed (simpler than owner)

---

## File Count Estimate

| Layer | Count |
|-------|-------|
| Backend PHP | 3 |
| Frontend types/api/animations | 9 |
| Frontend hooks | 3 |
| Frontend components | 7 |
| Frontend pages + index | 6 |
| Layout | 1 |
| Router | 1 |
| READMEs | 4 |
| **Total** | **~34** |
