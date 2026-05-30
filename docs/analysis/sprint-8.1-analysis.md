# Sprint 8.1 Analysis — Academy Partner Role: Dashboard + Students + Briefs + Notifications

## Source Files Read

| Feature | Source file(s) |
|---------|---------------|
| Auth guard | `New/Academy Partner/Academy dashboard/academy/_guard.php` |
| Dashboard | `New/Academy Partner/Academy dashboard/academy/dashboard.php` |
| Linked students | `New/Academy Partner/Linked students overview/academy/dashboard.php` |
| Student status | `New/Academy Partner/Student status overview/academy/dashboard.php` |
| Briefs list | `New/Academy Partner/Academy briefs/academy/briefs.php` |
| Brief detail | `New/Academy Partner/Academy briefs/academy/briefs/detail.php` |
| New brief form | `New/Academy Partner/Submit new student brief/academy/briefs/new.php` |
| Brief status tracking | `New/Academy Partner/Brief status tracking/academy/briefs/detail.php` |
| Notifications | `New/Academy Partner/Academy notifications/academy/notifications.php` |
| Login | `New/Academy Partner/Academy login - logout/academy/login.php` |
| student-briefs lib | `New/Core/lib/student-briefs.php` |

**Note:** "Linked students overview", "Student status overview", and "Academy dashboard" all render from the **same PHP query** — they are the same dashboard page published under different feature folders. The "Communication with teacher around briefs" folder also uses the identical briefs list/new/detail files.

---

## Auth Pattern (CRITICAL — differs from teacher/owner)

Academy uses **session-based auth** with `$_SESSION['academy_id']`, NOT `require_teacher()`:

```php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);
```

**Login mechanism:** Academy logs in by submitting an `access_code` (no username/password).
The `access_code` is looked up in the `academies` table: `WHERE status='active' AND access_code=?`.
On success: `$_SESSION['academy_id'] = (int)$academy['id']`.

**Lib path (double-nested — same pattern as parent):**
```php
require_once __DIR__ . '/../../lib/lib/helpers.php';       // backend/lib/lib/helpers.php
require_once __DIR__ . '/../../config/db.php';              // backend/config/db.php
require_once __DIR__ . '/../../lib/lib/roles-portals.php'; // backend/lib/lib/roles-portals.php
require_once __DIR__ . '/../../lib/lib/student-briefs.php';// backend/lib/lib/student-briefs.php
require_once __DIR__ . '/../../lib/lib/platform-notifications.php';
```

**Directory:** `backend/api/academy/` does NOT exist yet — must be created.

---

## Database Tables

### `academies` (existing)
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED | PK |
| name | VARCHAR | Academy display name |
| email | VARCHAR | Contact email |
| status | VARCHAR | `'active'` / `'inactive'` |
| access_code | VARCHAR | Login code (prefix `ACAD`) |

### `academy_students` (existing, managed by owner)
| Column | Type | Notes |
|--------|------|-------|
| academy_id | INT UNSIGNED | FK → academies.id |
| student_id | INT UNSIGNED | FK → students.id |
| status | VARCHAR | `'active'` / `'inactive'` |

### `students` (existing)
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED | PK |
| full_name | VARCHAR | |
| login_code | VARCHAR | |
| level | VARCHAR | nullable |
| is_active | TINYINT | 1 = active |

### `lesson_plan_sessions` (existing)
Used for completed/upcoming session counts per student.
- `status IN ('completed')` → completed count
- `status IN ('planned','rescheduled') AND planned_date >= CURDATE()` → upcoming count

### `student_briefs` (created by `ensure_student_brief_tables`)
Key columns for academy:
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED | PK |
| academy_id | INT UNSIGNED | FK — set on INSERT |
| student_name | VARCHAR(190) | Required |
| age | VARCHAR(40) | Optional |
| source_name | VARCHAR(190) | Auto-filled from academies.name |
| source_email | VARCHAR(190) | Auto-filled from academies.email |
| nationality | VARCHAR(120) | Required |
| contracted_hours | VARCHAR(80) | Required |
| native_language | VARCHAR(120) | Required (current level notes) |
| studied_arabic_before | ENUM('yes','no') | Required |
| learning_reason | TEXT | Required |
| main_goal | TEXT | Required |
| target_duration | VARCHAR(190) | Required |
| additional_notes | TEXT | Optional |
| speaking_ability | TEXT | Optional |
| reading_writing_ability | TEXT | Optional |
| parent_contact_info | TEXT | Optional |
| preferred_schedule | TEXT | Optional |
| owner_notes | TEXT | Owner-only — read-only for academy |
| brief_status | VARCHAR(40) | Default `'submitted'` |
| conversion_status | ENUM('pending','converted') | Default `'pending'` |
| submitted_by_role | ENUM('academy','teacher','student') | Always `'academy'` |
| created_at | DATETIME | Auto |
| updated_at | DATETIME | Auto |

### `push_notifications` (existing)
Used for academy notifications: `(user_type='academy' OR target_role='academy') AND user_id=$academy_id`.

---

## Student Query (used by home.php and students.php)

```sql
SELECT st.id, st.full_name, st.login_code, st.level, st.is_active,
       COUNT(CASE WHEN lps.status = 'completed' THEN 1 END)             AS completed_sessions,
       COUNT(CASE WHEN lps.status IN ('planned','rescheduled')
                   AND lps.planned_date >= CURDATE() THEN 1 END)        AS upcoming_sessions
FROM academy_students ast
JOIN students st ON st.id = ast.student_id
LEFT JOIN lesson_plan_sessions lps ON lps.student_id = st.id
WHERE ast.academy_id = ?
  AND ast.status = 'active'
GROUP BY st.id
ORDER BY st.full_name
```

---

## Backend API Specs

### 1. `GET /api/academy/home`

**Purpose:** Single call for the academy dashboard — academy info + student list + KPIs.

**Logic:**
1. Auth: `$_SESSION['academy_id']`
2. `portals_ensure_schema($pdo)`
3. Fetch academy: `SELECT id, name, email, status FROM academies WHERE id = ?`
4. If not found: `json_err('Academy not found', 404)`
5. Run student query (above)
6. Compute KPIs from `$students` array:
   - `student_count = count($students)`
   - `total_completed = array_sum(array_column($students, 'completed_sessions'))`
   - `total_upcoming = array_sum(array_column($students, 'upcoming_sessions'))`

**Response:**
```json
{
  "ok": true,
  "academy": {
    "id": 1,
    "name": "Al Noor Academy",
    "email": "contact@alnoor.com",
    "status": "active"
  },
  "students": [
    {
      "id": 10,
      "full_name": "Ahmed Hassan",
      "login_code": "STU-123456",
      "level": "Beginner",
      "is_active": 1,
      "completed_sessions": 8,
      "upcoming_sessions": 2
    }
  ],
  "kpis": {
    "student_count": 5,
    "total_completed": 40,
    "total_upcoming": 12
  }
}
```

---

### 2. `GET /api/academy/students`

**Purpose:** Standalone students endpoint (used by the Students feature page, keeps dashboard and students page independently cacheable).

**Logic:** Identical student query — no difference from home.php students array. Returns just students + KPI counts.

**Response:**
```json
{
  "ok": true,
  "students": [ /* same student objects as home */ ],
  "kpis": {
    "student_count": 5,
    "total_completed": 40,
    "total_upcoming": 12
  }
}
```

---

### 3. `GET /api/academy/briefs` — List

**Logic:**
1. Auth + `portals_ensure_schema` + `ensure_student_brief_tables`
2. Fetch all briefs: `SELECT id, student_name, main_goal, brief_status, created_at FROM student_briefs WHERE academy_id = ? ORDER BY created_at DESC, id DESC`

**Response:**
```json
{
  "ok": true,
  "briefs": [
    {
      "id": 5,
      "student_name": "Sara Ali",
      "main_goal": "Learn conversational Arabic",
      "brief_status": "submitted",
      "created_at": "2026-05-20 10:00:00"
    }
  ]
}
```

---

### 3b. `GET /api/academy/briefs?id=N` — Detail

**Logic:**
1. Auth + `ensure_student_brief_tables`
2. Fetch single: `SELECT * FROM student_briefs WHERE id = ? AND academy_id = ? LIMIT 1`
3. If not found: `json_err('Brief not found', 404)`

**Response:** Full `student_briefs` row as object (all columns).

---

### 3c. `POST /api/academy/briefs` — Create

**Body (JSON or FormData):**
```
student_name, age, nationality, native_language, contracted_hours,
studied_arabic_before, target_duration, learning_reason, main_goal,
speaking_ability, reading_writing_ability, parent_contact_info,
preferred_schedule, additional_notes
```

**Logic:**
1. Auth + `ensure_student_brief_tables`
2. Fetch academy name/email: `SELECT name, email FROM academies WHERE id = ?`
3. Validate: `student_name` required; `main_goal` required; `learning_reason` required
4. Sanitize and truncate fields (see `student_brief_validate` in lib — use it)
5. INSERT into `student_briefs` with:
   - `academy_id = $academy_id`
   - `source_name = $academy['name']`
   - `source_email = $academy['email']`
   - `submitted_by_role = 'academy'`
   - `brief_status = 'submitted'`
6. `platform_notify` — notify teacher:
   ```php
   platform_notify($pdo, [
     'target_role' => 'teacher',
     'user_id'     => 0,
     'title'       => 'New academy brief',
     'message'     => 'Academy submitted a new brief for ' . $student_name,
     'action_label'=> 'Review Brief',
     'action_url'  => '/owner/academy-briefs/detail.php?id=' . $brief_id,
     'related_entity_type' => 'academy_brief',
     'related_entity_id'   => $brief_id,
   ]);
   ```
7. Response: `{ ok: true, id: $brief_id }`

**Validation errors response:**
```json
{ "ok": false, "error": "Student name is required" }
```

---

### 4. `GET /api/academy/notifications`

**Logic:**
1. Auth
2. `SELECT * FROM push_notifications WHERE (user_type='academy' OR target_role='academy') AND user_id = ? ORDER BY id DESC LIMIT 200`
3. Count unread: items where `read_at IS NULL`

**Response:**
```json
{
  "ok": true,
  "notifications": [
    {
      "id": 1,
      "title": "Brief status updated",
      "body": "Your brief for Sara Ali has been reviewed.",
      "action_label": "View",
      "url": "/owner/academy-briefs/detail.php?id=5",
      "read_at": null,
      "created_at": "2026-05-20 09:00:00"
    }
  ],
  "unread_count": 3
}
```

---

### 5. `POST /api/academy/notifications/mark-read`

**Logic:**
1. Auth
2. `UPDATE push_notifications SET read_at = NOW() WHERE (user_type='academy' OR target_role='academy') AND user_id = ?`
3. Response: `{ ok: true }`

---

## Frontend TypeScript Types

### `features/dashboard/types.ts`
```typescript
export interface AcademyInfo {
  id: number
  name: string
  email: string | null
  status: string
}

export interface AcademyStudent {
  id: number
  full_name: string
  login_code: string
  level: string | null
  is_active: number
  completed_sessions: number
  upcoming_sessions: number
}

export interface AcademyKPIs {
  student_count: number
  total_completed: number
  total_upcoming: number
}

export interface AcademyHomeData {
  academy: AcademyInfo
  students: AcademyStudent[]
  kpis: AcademyKPIs
}
```

### `features/students/types.ts`
```typescript
export interface AcademyStudentsData {
  students: AcademyStudent[]
  kpis: AcademyKPIs
}
// Re-export AcademyStudent + AcademyKPIs from dashboard/types
```

### `features/briefs/types.ts`
```typescript
export type BriefStatus = 'submitted' | 'reviewing' | 'accepted' | 'rejected'

export interface BriefListItem {
  id: number
  student_name: string
  main_goal: string
  brief_status: BriefStatus
  created_at: string
}

export interface BriefDetail {
  id: number
  student_name: string
  age: string | null
  nationality: string
  contracted_hours: string
  native_language: string
  studied_arabic_before: 'yes' | 'no'
  learning_reason: string
  main_goal: string
  target_duration: string
  additional_notes: string | null
  speaking_ability: string | null
  reading_writing_ability: string | null
  parent_contact_info: string | null
  preferred_schedule: string | null
  owner_notes: string | null
  brief_status: BriefStatus
  conversion_status: 'pending' | 'converted'
  created_at: string
  updated_at: string
}

export interface NewBriefPayload {
  student_name: string
  age: string
  nationality: string
  native_language: string
  contracted_hours: string
  studied_arabic_before: 'yes' | 'no'
  target_duration: string
  learning_reason: string
  main_goal: string
  speaking_ability: string
  reading_writing_ability: string
  parent_contact_info: string
  preferred_schedule: string
  additional_notes: string
}

export interface BriefsData {
  briefs: BriefListItem[]
}
```

### `features/notifications/types.ts`
```typescript
export interface AcademyNotification {
  id: number
  title: string
  body: string
  action_label: string | null
  url: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationsData {
  notifications: AcademyNotification[]
  unread_count: number
}
```

---

## Frontend API Functions

### `dashboard/api.ts`
```typescript
import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { AcademyHomeData } from './types'

export const fetchAcademyHome = async (): Promise<AcademyHomeData> => {
  const res = await apiClient.get<ApiOk<AcademyHomeData>>('/api/academy/home')
  return { academy: res.academy, students: res.students, kpis: res.kpis }
}
```

### `students/api.ts`
```typescript
import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { AcademyStudentsData } from './types'

export const fetchAcademyStudents = async (): Promise<AcademyStudentsData> => {
  const res = await apiClient.get<ApiOk<AcademyStudentsData>>('/api/academy/students')
  return { students: res.students, kpis: res.kpis }
}
```

### `briefs/api.ts`
```typescript
import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { BriefsData, BriefDetail, NewBriefPayload } from './types'

export const fetchBriefs = async (): Promise<BriefsData> => {
  const res = await apiClient.get<ApiOk<BriefsData>>('/api/academy/briefs')
  return { briefs: res.briefs }
}

export const fetchBriefDetail = async (id: number): Promise<BriefDetail> => {
  const res = await apiClient.get<ApiOk<{ brief: BriefDetail }>>(`/api/academy/briefs?id=${id}`)
  return res.brief
}

export const submitBrief = (payload: NewBriefPayload): Promise<ApiOk<{ id: number }>> =>
  apiClient.post<ApiOk<{ id: number }>>('/api/academy/briefs', payload as unknown as Record<string, unknown>)
```

### `notifications/api.ts`
```typescript
import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { NotificationsData } from './types'

export const fetchNotifications = async (): Promise<NotificationsData> => {
  const res = await apiClient.get<ApiOk<NotificationsData>>('/api/academy/notifications')
  return { notifications: res.notifications, unread_count: res.unread_count }
}

export const markAllRead = (): Promise<ApiOk> =>
  apiClient.post<ApiOk>('/api/academy/notifications/mark-read', {})
```

---

## Frontend Hooks

### `dashboard/hooks/useAcademyHome.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchAcademyHome } from '../api'

export const useAcademyHome = () =>
  useQuery({ queryKey: ['academy-home'], queryFn: fetchAcademyHome, staleTime: 30_000 })
```

### `students/hooks/useAcademyStudents.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchAcademyStudents } from '../api'

export const useAcademyStudents = () =>
  useQuery({ queryKey: ['academy-students'], queryFn: fetchAcademyStudents, staleTime: 30_000 })
```

### `briefs/hooks/useBriefs.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchBriefs } from '../api'

export const useBriefs = () =>
  useQuery({ queryKey: ['academy-briefs'], queryFn: fetchBriefs, staleTime: 10_000 })
```

### `briefs/hooks/useBriefDetail.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchBriefDetail } from '../api'

export const useBriefDetail = (id: number) =>
  useQuery({
    queryKey: ['academy-brief', id],
    queryFn: () => fetchBriefDetail(id),
    enabled: id > 0,
    staleTime: 15_000,
  })
```

### `notifications/hooks/useAcademyNotifications.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markAllRead } from '../api'

export const useAcademyNotifications = () =>
  useQuery({ queryKey: ['academy-notifications'], queryFn: fetchNotifications, staleTime: 15_000 })

export const useMarkAllRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academy-notifications'] }),
  })
}
```

---

## Frontend Component Structure

### Dashboard (`/academy`)
```
features/dashboard/
├── types.ts
├── api.ts
├── animations.ts
├── hooks/
│   └── useAcademyHome.ts
├── components/
│   ├── AcademyKPIStrip.tsx      — 3 KPIs: students, completed, upcoming
│   └── AcademyStudentList.tsx   — Student rows with is_active badge + session counts
├── AcademyDashboardPage.tsx     — Composes all; welcome header with academy name
├── index.ts
└── README.md
```

**AcademyDashboardPage layout:**
- Header: Academy name (from `academy.name`) + "أكاديمية شريكة" badge
- KPI strip: student_count | total_completed | total_upcoming
- Student list (animated): name, login_code, level, completed_sessions, upcoming_sessions, active badge
- Link from each student → not available (academy cannot access student detail pages)
- CTA button: "بريف جديد" → `/academy/briefs/new`

### Students (`/academy/students`)
```
features/students/
├── types.ts
├── api.ts
├── animations.ts
├── hooks/
│   └── useAcademyStudents.ts
├── components/
│   └── StudentStatusRow.tsx    — Detailed student row with is_active toggle badge
├── AcademyStudentsPage.tsx     — Full student list with search filter
├── index.ts
└── README.md
```

### Briefs (`/academy/briefs`, `/academy/briefs/new`, `/academy/briefs/:id`)
```
features/briefs/
├── types.ts
├── api.ts
├── animations.ts
├── hooks/
│   ├── useBriefs.ts
│   └── useBriefDetail.ts
├── components/
│   ├── BriefStatusBadge.tsx    — submitted/reviewing/accepted/rejected chip
│   ├── BriefCard.tsx           — Brief list card: student_name + goal + status + date
│   └── NewBriefForm.tsx        — Full 14-field form (max 200 lines → split into sections)
├── BriefsPage.tsx              — List + "New Brief" CTA
├── BriefDetailPage.tsx         — All fields read-only; owner_notes shown if set
├── NewBriefPage.tsx            — Form page (uses NewBriefForm)
├── index.ts
└── README.md
```

**Brief status chip colours:**
| Status | Background | Text |
|--------|-----------|------|
| submitted | `--accent-soft` | `--accent` |
| reviewing | `--info-bg` | `--info` |
| accepted | `--success-bg` | `--success` |
| rejected | `--danger-bg` | `--danger` |

**NewBriefForm — two logical sections to stay under 200 lines:**
- Section 1: student_name, age, nationality, native_language, contracted_hours, studied_arabic_before, target_duration
- Section 2: learning_reason, main_goal, speaking_ability, reading_writing_ability, parent_contact_info, preferred_schedule, additional_notes

**useMutation on submit:** `mutationFn: submitBrief` → on success: `navigate('/academy/briefs')` + invalidate `['academy-briefs']`

### Notifications (`/academy/notifications`)
```
features/notifications/
├── types.ts
├── api.ts
├── animations.ts
├── hooks/
│   └── useAcademyNotifications.ts
├── components/
│   └── NotificationCard.tsx    — title, body, action button, read/unread indicator
├── AcademyNotificationsPage.tsx — List + "Mark all read" button
├── index.ts
└── README.md
```

---

## Academy Layout + Router

### `components/AcademyLayout.tsx`
Minimal layout — sticky header with academy name badge and nav links. No sidebar (same pattern as ParentLayout). Nav items: Dashboard | Students | Briefs | Notifications.

### `index.tsx` (AcademyApp router)
```tsx
import { Routes, Route } from 'react-router-dom'
import { AcademyLayout } from './components/AcademyLayout'
import { AcademyDashboardPage } from './features/dashboard'
import { AcademyStudentsPage } from './features/students'
import { BriefsPage, BriefDetailPage, NewBriefPage } from './features/briefs'
import { AcademyNotificationsPage } from './features/notifications'

const AcademyApp: FC = () => (
  <AcademyLayout>
    <Routes>
      <Route index element={<AcademyDashboardPage />} />
      <Route path="students" element={<AcademyStudentsPage />} />
      <Route path="briefs" element={<BriefsPage />} />
      <Route path="briefs/new" element={<NewBriefPage />} />
      <Route path="briefs/:id" element={<BriefDetailPage />} />
      <Route path="notifications" element={<AcademyNotificationsPage />} />
    </Routes>
  </AcademyLayout>
)
```

**Routes (6 total):**
```
/academy                  — AcademyDashboardPage
/academy/students         — AcademyStudentsPage
/academy/briefs           — BriefsPage (list)
/academy/briefs/new       — NewBriefPage (create form)
/academy/briefs/:id       — BriefDetailPage (read-only detail)
/academy/notifications    — AcademyNotificationsPage
```

---

## Backend File Templates

### `backend/api/academy/home.php`
```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);

$stmt = $pdo->prepare('SELECT id, name, email, status FROM academies WHERE id = ? LIMIT 1');
$stmt->execute([$academy_id]);
$academy = $stmt->fetch();
if (!$academy) json_err('Academy not found', 404);

$sStmt = $pdo->prepare("
    SELECT st.id, st.full_name, st.login_code, st.level, st.is_active,
           COUNT(CASE WHEN lps.status = 'completed' THEN 1 END) AS completed_sessions,
           COUNT(CASE WHEN lps.status IN ('planned','rescheduled')
                       AND lps.planned_date >= CURDATE() THEN 1 END) AS upcoming_sessions
    FROM academy_students ast
    JOIN students st ON st.id = ast.student_id
    LEFT JOIN lesson_plan_sessions lps ON lps.student_id = st.id
    WHERE ast.academy_id = ? AND ast.status = 'active'
    GROUP BY st.id
    ORDER BY st.full_name
");
$sStmt->execute([$academy_id]);
$students = $sStmt->fetchAll() ?: [];

$totalCompleted = array_sum(array_column($students, 'completed_sessions'));
$totalUpcoming  = array_sum(array_column($students, 'upcoming_sessions'));

json_ok([
    'academy'  => $academy,
    'students' => $students,
    'kpis'     => [
        'student_count'   => count($students),
        'total_completed' => (int)$totalCompleted,
        'total_upcoming'  => (int)$totalUpcoming,
    ],
]);
```

### `backend/api/academy/students.php`
```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);

$sStmt = $pdo->prepare("
    SELECT st.id, st.full_name, st.login_code, st.level, st.is_active,
           COUNT(CASE WHEN lps.status = 'completed' THEN 1 END) AS completed_sessions,
           COUNT(CASE WHEN lps.status IN ('planned','rescheduled')
                       AND lps.planned_date >= CURDATE() THEN 1 END) AS upcoming_sessions
    FROM academy_students ast
    JOIN students st ON st.id = ast.student_id
    LEFT JOIN lesson_plan_sessions lps ON lps.student_id = st.id
    WHERE ast.academy_id = ? AND ast.status = 'active'
    GROUP BY st.id
    ORDER BY st.full_name
");
$sStmt->execute([$academy_id]);
$students = $sStmt->fetchAll() ?: [];

json_ok([
    'students' => $students,
    'kpis'     => [
        'student_count'   => count($students),
        'total_completed' => (int)array_sum(array_column($students, 'completed_sessions')),
        'total_upcoming'  => (int)array_sum(array_column($students, 'upcoming_sessions')),
    ],
]);
```

### `backend/api/academy/briefs.php`
```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/student-briefs.php';
require_once __DIR__ . '/../../lib/lib/platform-notifications.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);
ensure_student_brief_tables($pdo);

$method = $_SERVER['REQUEST_METHOD'];

// GET ?id=N — single brief detail
if ($method === 'GET' && !empty($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare('SELECT * FROM student_briefs WHERE id = ? AND academy_id = ? LIMIT 1');
    $stmt->execute([$id, $academy_id]);
    $brief = $stmt->fetch();
    if (!$brief) json_err('Brief not found', 404);
    json_ok(['brief' => $brief]);
}

// GET — list all briefs
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, student_name, main_goal, brief_status, created_at
         FROM student_briefs
         WHERE academy_id = ?
         ORDER BY created_at DESC, id DESC'
    );
    $stmt->execute([$academy_id]);
    json_ok(['briefs' => $stmt->fetchAll() ?: []]);
}

// POST — create new brief
if ($method === 'POST') {
    $input = (array)(json_decode(file_get_contents('php://input'), true) ?? $_POST);

    [$data, $errors] = student_brief_validate($input, 'academy');
    if ($errors) json_err(array_values($errors)[0], 400);

    $aStmt = $pdo->prepare('SELECT name, email FROM academies WHERE id = ? LIMIT 1');
    $aStmt->execute([$academy_id]);
    $acad = $aStmt->fetch() ?: [];

    $ins = $pdo->prepare("
        INSERT INTO student_briefs
            (academy_id, student_name, age, source_name, source_email, nationality,
             contracted_hours, native_language, studied_arabic_before, learning_reason,
             main_goal, target_duration, additional_notes, speaking_ability,
             reading_writing_ability, parent_contact_info, preferred_schedule,
             submitted_by_role, brief_status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'academy','submitted')
    ");
    $ins->execute([
        $academy_id, $data['student_name'],
        trim((string)($input['age'] ?? '')),
        $acad['name'] ?? '', $acad['email'] ?? '',
        $data['nationality'], $data['contracted_hours'],
        $data['native_language'], $data['studied_arabic_before'],
        $data['learning_reason'], $data['main_goal'],
        $data['target_duration'], $data['additional_notes'] ?: null,
        trim((string)($input['speaking_ability'] ?? '')) ?: null,
        trim((string)($input['reading_writing_ability'] ?? '')) ?: null,
        trim((string)($input['parent_contact_info'] ?? '')) ?: null,
        trim((string)($input['preferred_schedule'] ?? '')) ?: null,
    ]);
    $briefId = (int)$pdo->lastInsertId();

    platform_notify($pdo, [
        'target_role'         => 'teacher',
        'user_id'             => 0,
        'title'               => 'New academy brief',
        'message'             => 'Academy submitted a new brief for ' . $data['student_name'],
        'action_label'        => 'Review Brief',
        'action_url'          => '/owner/academy-briefs/detail.php?id=' . $briefId,
        'related_entity_type' => 'academy_brief',
        'related_entity_id'   => $briefId,
    ]);

    json_ok(['id' => $briefId]);
}

json_err('Method not allowed', 405);
```

### `backend/api/academy/notifications.php`
```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo->prepare(
        "UPDATE push_notifications SET read_at = NOW()
         WHERE (user_type='academy' OR target_role='academy') AND user_id = ?"
    )->execute([$academy_id]);
    json_ok([]);
}

$stmt = $pdo->prepare(
    "SELECT id, title, body, action_label, url, read_at, created_at
     FROM push_notifications
     WHERE (user_type='academy' OR target_role='academy') AND user_id = ?
     ORDER BY id DESC LIMIT 200"
);
$stmt->execute([$academy_id]);
$notifications = $stmt->fetchAll() ?: [];
$unread = count(array_filter($notifications, static fn($n) => empty($n['read_at'])));

json_ok(['notifications' => $notifications, 'unread_count' => $unread]);
```

---

## Key Notes

1. **No `require_teacher()`** — academy auth is pure session check: `if (empty($_SESSION['academy_id']))`
2. **Access-code login** — no username/password; academy authenticates via `access_code` in `academies` table
3. **`portals_ensure_schema`** — must be called on every academy API request
4. **`ensure_student_brief_tables`** — required before any `student_briefs` query
5. **`student_brief_validate`** — always use for validation/sanitization in `briefs.php`; returns `[$data, $errors]`
6. **`source_name` / `source_email`** — auto-filled from `academies` table, NOT from form input
7. **Brief ownership check** — every brief query MUST include `AND academy_id = ?`
8. **Brief detail endpoint** — `GET /api/academy/briefs?id=N` (same file, different branch)
9. **POST body parsing** — accept both JSON (`php://input`) and `$_POST` for flexibility
10. **Lib path** — `../../lib/lib/helpers.php` (double-nested, same as parent role)
11. **`platform_notify`** for teacher on brief submit — target_role='teacher', user_id=0
12. **Notifications query** — filter by `(user_type='academy' OR target_role='academy') AND user_id=$academy_id`
13. **Directory does not exist** — `backend/api/academy/` must be created
14. **AcademyLayout** — nav header only (no sidebar), same pattern as ParentLayout
15. **BriefDetailPage** — `owner_notes` is read-only for academy (teacher/owner set it)
16. **`NewBriefForm` split** — keep under 200 lines by splitting into `BriefFormSection1.tsx` + `BriefFormSection2.tsx` or use a single component with concise JSX

---

## File Count Estimate

| Layer | Count |
|-------|-------|
| Backend PHP | 4 (home, students, briefs, notifications) |
| Frontend types | 4 |
| Frontend api | 4 |
| Frontend animations | 4 |
| Frontend hooks | 5 (useAcademyHome, useAcademyStudents, useBriefs, useBriefDetail, useAcademyNotifications + useMarkAllRead) |
| Frontend components | 8 (KPIStrip, StudentList, StudentStatusRow, BriefStatusBadge, BriefCard, NewBriefForm, NotificationCard) |
| Frontend pages | 7 (Dashboard, Students, Briefs, BriefDetail, NewBrief, Notifications) |
| Layout + Router | 2 |
| Index files | 4 |
| READMEs | 5 |
| **Total** | **~47** |
