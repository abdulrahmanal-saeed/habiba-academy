# Sprint 6.1 Analysis — Owner Portal: Dashboard + Analytics + Payments

## Source files read

| Source | Location in New/ |
|---|---|
| Analytics page | `Owner/Analytics - funnel - tracking/teacher/analytics.php` |
| Payments list | `Owner/Higher-level operational oversight/owner/payments/index.php` |
| Payment detail | `Owner/Payment review - manual verification/owner/payments/detail.php` |
| Portal stats | `Owner/Higher-level operational oversight/owner/portals/index.php` |
| Checkout lib | `Core/lib/checkout-flow.php` |
| Analytics tracker | `Core/includes/analytics_tracker.php` |
| Track event | `Core/includes/track_event.php` |

---

## Auth

Owner = Teacher: `require_teacher()` checks `$_SESSION['teacher_logged']`.  
No separate owner session. Both roles share the same login.

**Path prefix** for `backend/api/owner/*.php`: `../../lib/lib/helpers.php`, `../../config/config/db.php`

---

## DB Tables

### Analytics tables (created by `ensure_analytics_tables()`)

**visits**
```
id, session_id, device_type (desktop|mobile|tablet),
created_at, last_activity_at, referrer, ip_hash
```

**page_views**
```
id, session_id, page_url, page_title, created_at
```

**events**
```
id, session_id, event_name, metadata (JSON), created_at
```

Funnel event names: `pricing_view`, `checkout_start`, `checkout_submit`,  
`payment_pending`, `payment_paid`, `student_form_submit`

### Payment tables (created by `checkout_ensure_tables()`)

**checkout_orders**
```
id, checkout_reference, full_name, email, whatsapp,
selected_plan (single|monthly|bundle), amount_aed,
payment_status (pending|pending_verification|paid|failed|refunded),
payment_provider, payment_reference,
learner_type, main_goal, policy_agreed, policy_agreed_at,
student_form_status, level_check_status,
schedule_status, teacher_review_status,
created_at
```

**payment_records**
```
id, checkout_order_id, provider, provider_reference,
status, amount_aed, created_at, updated_at
```

**audit_logs**
```
id, entity_type, entity_id, action,
old_value, new_value, created_at
```
Filter: `WHERE entity_type = 'checkout_order' AND entity_id = ?`

### Student + Portal tables

**students**: `id, full_name, login_code, last_seen, is_active`

**homework_submissions**: `id, is_submitted, submitted_at`

**student_review_submissions**: `id, submitted_at`

**academies**: `id, status` (`<> 'inactive'` = active)

**academy_students**: `id, status` (`= 'active'`)

**parent_contacts**: `id, status` (`<> 'inactive'`)

**parent_students**: `id, status` (`= 'active'`)

**media_buyers**: `id, full_name, tracking_code, status` (`<> 'inactive'`)

**media_buyer_visits**: `id, media_buyer_id`

**marketing_attributions**: `id, media_buyer_id, converted_checkout_order_id`

---

## Backend Endpoints to Build (3 files)

### `backend/api/owner/home.php`

**GET** — Owner dashboard KPIs

Combines data from:
1. `analytics_fetch_student_engagement($pdo)` — live student activity
2. Portal stats (4 inline COUNT queries, same as portals/index.php)
3. Revenue summary (subset of `analytics_fetch_revenue($pdo)`)
4. `analytics_fetch_overview($pdo)` → `active_now` count

```php
// Response shape
{
  "engagement": {
    "hw_submitted_today": int,
    "hw_submitted_week": int,
    "reviews_submitted_week": int,
    "students_logged_in_today": int,
    "students_logged_in_week": int,
    "active_students": int
  },
  "portals": {
    "academies": int,
    "academy_students": int,
    "parents": int,
    "parent_students": int,
    "media_buyers": int
  },
  "revenue": {
    "paid_amount": float,
    "paid_orders": int,
    "pending_orders": int,
    "by_plan": [{ "selected_plan": string, "total_orders": int, "paid_amount": float }],
    "by_status": [{ "payment_status": string, "total": int }]
  },
  "active_now": int
}
```

Calls: `ensure_analytics_tables($pdo)`, `checkout_ensure_tables($pdo)`

---

### `backend/api/owner/analytics.php`

**GET** — Full analytics data (all 11 datasets in one response)

**GET `?partial=realtime`** — Realtime sessions only (for polling every 10s)

```php
// Full response shape
{
  "overview": { "total_visits": int, "unique_visitors": int, "active_now": int, "page_views": int },
  "daily_visits": [{ "day_key": "2026-05-01", "visit_count": int }],   // last 30 active days
  "device_breakdown": [{ "device_type": string, "cnt": int }],
  "hourly_pattern": [{ "hr": 0..23, "cnt": int }],                     // always 24 rows
  "engagement": { ...same as home.php engagement... },
  "funnel": {
    "visit": int,
    "pricing_view": int,
    "checkout_start": int,
    "checkout_submit": int,
    "payment_pending": int,
    "payment_paid": int,
    "student_form_submit": int
  },
  "revenue": { ...same as home.php revenue... },
  "media_buyers": [{ "full_name": string, "tracking_code": string, "visits": int, "conversions": int, "paid_amount": float }],
  "low_activity_students": [{ "id": int, "full_name": string, "login_code": string, "last_seen": string|null }],
  "top_pages": [{ "page_url": string, "page_title": string, "total_views": int }]
}

// Realtime partial (?partial=realtime)
{
  "sessions": [{ "session_id": string, "device_type": string, "last_activity_at": string, "page_url": string|null }]
}
```

Calls: `ensure_analytics_tables($pdo)`, `media_buyer_ensure_schema($pdo)`, `checkout_ensure_tables($pdo)`

---

### `backend/api/owner/payments.php`

**GET** — List checkout orders with filters

Query params:
- `status` — one of `pending|pending_verification|paid|failed|refunded|''`
- `q` — search against `checkout_reference`, `full_name`, `email`, `whatsapp`
- `id` — when present, returns single order detail instead of list

```php
// GET list response
{
  "orders": [ CheckoutOrder[] ],
  "stats": { "pending": int, "pending_verification": int, "paid": int, "failed": int, "refunded": int },
  "total": int
}

// GET detail (?id=123) response
{
  "order": CheckoutOrder,
  "payment_records": PaymentRecord[],
  "audit_logs": AuditLogEntry[]
}
```

**POST** — Two actions, both CSRF-protected

```
action=update_status  body: { id: int, payment_status: string }
action=check_ziina    body: { id: int }
```

- `update_status`: calls `checkout_set_payment_status($pdo, $id, $newStatus, 'owner')` → `{ ok: true, message: string }`
- `check_ziina`: looks up `checkout_reference`, calls `ziina_update_checkout_status($pdo, $ref, '')` → `{ ok: true, status: string }`

Requires: `../../lib/lib/checkout-flow.php`, `../../lib/lib/ziina.php`

---

## TypeScript Interfaces

```typescript
// features/dashboard/types.ts
export interface OwnerDashboardData {
  engagement: {
    hw_submitted_today: number
    hw_submitted_week: number
    reviews_submitted_week: number
    students_logged_in_today: number
    students_logged_in_week: number
    active_students: number
  }
  portals: {
    academies: number
    academy_students: number
    parents: number
    parent_students: number
    media_buyers: number
  }
  revenue: {
    paid_amount: number
    paid_orders: number
    pending_orders: number
    by_plan: Array<{ selected_plan: string; total_orders: number; paid_amount: number }>
    by_status: Array<{ payment_status: string; total: number }>
  }
  active_now: number
}

// features/analytics/types.ts
export interface AnalyticsOverview {
  total_visits: number
  unique_visitors: number
  active_now: number
  page_views: number
}
export interface DailyVisit { day_key: string; visit_count: number }
export interface DeviceBreakdown { device_type: string; cnt: number }
export interface HourlyPattern { hr: number; cnt: number }
export interface AnalyticsFunnel {
  visit: number
  pricing_view: number
  checkout_start: number
  checkout_submit: number
  payment_pending: number
  payment_paid: number
  student_form_submit: number
}
export interface MediaBuyerStat {
  full_name: string
  tracking_code: string
  visits: number
  conversions: number
  paid_amount: number
}
export interface LowActivityStudent {
  id: number
  full_name: string
  login_code: string
  last_seen: string | null
}
export interface TopPage { page_url: string; page_title: string; total_views: number }
export interface RealtimeSession {
  session_id: string
  device_type: string
  last_activity_at: string
  page_url: string | null
}
export interface AnalyticsData {
  overview: AnalyticsOverview
  daily_visits: DailyVisit[]
  device_breakdown: DeviceBreakdown[]
  hourly_pattern: HourlyPattern[]
  engagement: OwnerDashboardData['engagement']
  funnel: AnalyticsFunnel
  revenue: OwnerDashboardData['revenue']
  media_buyers: MediaBuyerStat[]
  low_activity_students: LowActivityStudent[]
  top_pages: TopPage[]
}
export interface RealtimeData { sessions: RealtimeSession[] }

// features/payments/types.ts
export type PaymentStatus = 'pending' | 'pending_verification' | 'paid' | 'failed' | 'refunded'
export interface CheckoutOrder {
  id: number
  checkout_reference: string
  full_name: string
  email: string
  whatsapp: string
  selected_plan: string
  amount_aed: number
  payment_status: PaymentStatus
  learner_type: string
  main_goal: string
  policy_agreed: boolean
  policy_agreed_at: string
  student_form_status: string
  level_check_status: string
  schedule_status: string
  teacher_review_status: string
  payment_provider: string
  payment_reference: string
  created_at: string
}
export interface PaymentRecord {
  id: number
  checkout_order_id: number
  provider: string
  provider_reference: string
  status: string
  amount_aed: number
  created_at: string
  updated_at: string
}
export interface AuditLogEntry {
  id: number
  entity_type: string
  entity_id: number
  action: string
  old_value: string
  new_value: string
  created_at: string
}
export interface PaymentsListResponse {
  orders: CheckoutOrder[]
  stats: Record<PaymentStatus, number>
  total: number
}
export interface PaymentDetailResponse {
  order: CheckoutOrder
  payment_records: PaymentRecord[]
  audit_logs: AuditLogEntry[]
}
```

---

## Frontend Feature Plan

### Layout (new files)

**`roles/owner/components/OwnerLayout.tsx`** — same structure as TeacherLayout:
- flex row: `OwnerSidebar` (sticky rail, w-64) + column: header + main
- Header: right-aligned with user badge "Owner"
- No NotificationBell in Sprint 6.1 (add in later sprint)

**`roles/owner/components/OwnerSidebar.tsx`** — same icon-rail pattern as TeacherSidebar:
| Key | Label | Icon | Route |
|---|---|---|---|
| dashboard | Dashboard | Home | /owner |
| analytics | Analytics | BarChart2 | /owner/analytics |
| payments | Payments | CreditCard | /owner/payments |
| *(future)* articles | Articles | FileText | /owner/articles |
| *(future)* videos | Videos | Video | /owner/videos |
| *(future)* help-cms | Help CMS | HelpCircle | /owner/help-cms |
| *(future)* settings | Settings | Settings | /owner/settings |

### Feature: `features/dashboard/` (Sprint 6.1)

Files:
```
dashboard/
  index.ts
  DashboardPage.tsx         (main, max 200 lines)
  types.ts
  api.ts                    dashboardApi.getDashboard()
  hooks/useDashboard.ts     useQuery, staleTime: 60_000
  components/
    KpiGrid.tsx             student engagement KPIs (6 cards)
    PortalsGrid.tsx         portal stats (5 cards with nav links)
    RevenueCard.tsx         paid total + plan breakdown list
  README.md
```

Layout: three sections stacked —
1. Top row: `<KpiGrid />` (6 KPI cards, 3-col grid)
2. Middle row: `<PortalsGrid />` (5 portal stat cards) + `<RevenueCard />` (1 card)
3. Live: `active_now` badge in header (from DashboardPage query)

### Feature: `features/analytics/` (Sprint 6.1)

Files:
```
analytics/
  index.ts
  AnalyticsPage.tsx          tabbed: Overview | Funnel | Revenue | Engagement | Media Buyers
  types.ts
  api.ts                     analyticsApi.getAnalytics() + getRealtimeSessions()
  hooks/useAnalytics.ts      staleTime: 120_000; refetchOnWindowFocus: false
  hooks/useRealtime.ts       refetchInterval: 10_000, queryKey: ['analytics','realtime']
  components/
    OverviewCards.tsx         total_visits, unique_visitors, active_now, page_views
    DailyChart.tsx            bar chart using native SVG (no chart lib dependency)
    DevicePie.tsx             device_breakdown as pill bars (no pie chart lib)
    HourlyHeatmap.tsx         24h row of colored cells
    FunnelChart.tsx           horizontal step funnel
    RevenueStats.tsx          paid_amount + by_plan table + by_status badges
    MediaBuyersTable.tsx      sortable table of media buyer stats
    TopPagesTable.tsx         top 10 pages
    LowActivityList.tsx       warning list of inactive students
    RealtimePanel.tsx         live sessions, refreshes via useRealtime
  README.md
```

**Chart approach**: SVG-based bar/funnel, no recharts/chartjs dependency.  
Pattern: raw `<svg viewBox>` with scaled rects. Simple and dependency-free.

### Feature: `features/payments/` (Sprint 6.1)

Files:
```
payments/
  index.ts
  PaymentsPage.tsx           filterable list + status stat pills
  types.ts
  api.ts                     paymentsApi.getList() + getDetail() + updateStatus() + checkZiina()
  hooks/usePayments.ts       useQuery for list, useMutation for status update
  components/
    PaymentStatusBadge.tsx   color-coded badge per status
    PaymentsTable.tsx        table with reference, name, plan, amount, status, date, action
    PaymentDetailDrawer.tsx  split-drawer: order details + pipeline + audit log + status form
    components/
      PipelineStatus.tsx     5-step pipeline grid
      AuditLog.tsx           event list
      StatusForm.tsx         select + save + check ziina button
  README.md
```

**PaymentDetailDrawer** uses split-drawer key-remount:  
```tsx
<Inner key={order?.id ?? 'new'} {...props} />
```

**Status update** = optimistic: set local status immediately, rollback on error.

---

## Wiring Changes (roles/owner/index.tsx)

Replace stub "coming soon" with:

```tsx
import { Outlet } from 'react-router-dom'
import { OwnerLayout } from './components/OwnerLayout'
import { DashboardPage } from './features/dashboard'
import { AnalyticsPage } from './features/analytics'
import { PaymentsPage } from './features/payments'

export default function OwnerApp() {
  return (
    <OwnerLayout>
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
      </Routes>
    </OwnerLayout>
  )
}
```

Router entry (in `router/index.tsx` or equivalent) — already wired with `/owner` prefix.

---

## File Count Estimate

| Layer | Count |
|---|---|
| Backend PHP | 3 (home.php, analytics.php, payments.php) |
| Layout components | 2 (OwnerLayout, OwnerSidebar) |
| Dashboard feature | ~9 files |
| Analytics feature | ~16 files |
| Payments feature | ~12 files |
| **Total** | **~42 files** |

---

## Patterns to reuse from Phase 5

- **Split-drawer key-remount**: `<Inner key={order?.id ?? 'new'} />`
- **Optimistic toggle**: `onMutate` → `setQueryData`, `onError` → rollback
- **Double-nested lib paths**: `../../lib/lib/helpers.php` (from `api/owner/*.php`)
- **postForm** for FormData, **post** for JSON, **get** for reads
- `cardVariant`, `fadeInUp`, `drawerVariant`, `modalBackdrop` from `@/design-system/animations`
- `var(--accent)` teal `#0d4f4f` — never hardcode colors
