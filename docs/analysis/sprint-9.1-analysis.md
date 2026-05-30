# Sprint 9.1 Analysis — Media Buyer Role
# Phase 9: Media Buyer Portal

## Source Files Read
- `New/Media Buyer/Media buyer dashboard/media-buyer/_guard.php`
- `New/Media Buyer/Media buyer login - logout/media-buyer/login.php`
- `New/Media Buyer/Media buyer dashboard/media-buyer/dashboard.php` (main — all features in one)
- `New/Media Buyer/Agreement - contract status/media-buyer/agreement.php`
- `New/Media Buyer/Media buyer notifications/media-buyer/notifications.php`
- All feature-specific `dashboard.php` copies (identical — one consolidated dashboard)

---

## Auth Flow

**Session key:** `$_SESSION['media_buyer_id']`

**Login logic:**
- POST `email_or_whatsapp` + `access_code`
- Query: `SELECT * FROM media_buyers WHERE status = 'active' AND access_code = ? AND (LOWER(REPLACE(email,'',''')) = ? OR REPLACE(whatsapp,' ','') = ?)`
- Uses `portals_normalize_login()` on the login field before matching
- Sets `$_SESSION['media_buyer_id'] = $buyer['id']` on success

**Guard:**
```php
if (empty($_SESSION['media_buyer_id'])) → redirect /media-buyer/login
portals_ensure_schema($pdo)
media_buyer_ensure_schema($pdo)
$media_buyer_id = (int)$_SESSION['media_buyer_id']
```

**Agreement gate (checked on every dashboard request):**
```php
$activeTemplate = query("SELECT id, requires_reacceptance FROM media_buyer_agreement_templates WHERE active = 1 ORDER BY id DESC LIMIT 1")
$acceptedTemplateId = query("SELECT template_id FROM media_buyer_agreement_acceptances WHERE media_buyer_id = ? ORDER BY accepted_at DESC LIMIT 1")
if (!$acceptedTemplateId || (requires_reacceptance=1 && acceptedTemplateId !== activeTemplate.id)) → redirect /agreement
```

**PHP libs required:**
- `require_once __DIR__ . '/../../lib/lib/helpers.php'`
- `require_once __DIR__ . '/../../config/db.php'`
- `require_once __DIR__ . '/../../lib/lib/roles-portals.php'` → `portals_ensure_schema()`, `portals_normalize_login()`
- `require_once __DIR__ . '/../../lib/lib/media-buyer.php'` → `media_buyer_ensure_schema()`, `media_buyer_default_campaign()`, `media_buyer_tracking_url()`
- `require_once __DIR__ . '/../../lib/lib/platform-notifications.php'` → `platform_notifications_ensure_schema()`

---

## Database Tables

### `media_buyers`
| Column | Type | Notes |
|--------|------|-------|
| id | int | PK |
| full_name | varchar | Display name |
| email | varchar | Login identifier |
| whatsapp | varchar | Login identifier |
| access_code | varchar | Login credential |
| status | enum('active','inactive') | Must be 'active' to login |
| commission_rate | decimal(5,2) | NULL = 0% |

### `checkout_orders`
| Column | Notes |
|--------|-------|
| media_buyer_id | FK |
| payment_status | 'paid' or other |
| amount_aed | decimal |

### `media_buyer_commissions`
| Column | Notes |
|--------|-------|
| id | PK |
| media_buyer_id | FK |
| commission_amount_aed | decimal |
| status | 'pending' / 'paid' / 'cancelled' |
| created_at | datetime |

### `media_buyer_visits`
| Column | Notes |
|--------|-------|
| media_buyer_id | FK |
| session_token | unique session identifier |
| duration_seconds | int |
| source_label | string |
| device_type | string |
| country | string |
| first_seen_at | datetime |
| last_path | string |
| last_event | string |

### `marketing_attributions`
| Column | Notes |
|--------|-------|
| media_buyer_id | FK |
| visitor_id | string |
| converted_checkout_order_id | int, nullable |
| expires_at | datetime (30-day window) |

### `media_buyer_agreement_templates`
| Column | Notes |
|--------|-------|
| id | PK |
| active | tinyint(1) |
| requires_reacceptance | tinyint(1) |
| version | varchar |
| content | text |

### `media_buyer_agreement_acceptances`
| Column | Notes |
|--------|-------|
| media_buyer_id | FK |
| template_id | FK |
| template_version | varchar |
| accepted_content_snapshot | text |
| typed_name | varchar |
| ip_hash | varchar |
| user_agent_hash | varchar |
| accepted_at | datetime |

### `push_notifications`
Filter: `(user_type = 'media_buyer' OR target_role = 'media_buyer') AND user_id = $media_buyer_id`

---

## SQL Queries (Verbatim)

### home.php — Buyer profile
```sql
SELECT * FROM media_buyers WHERE id = ? LIMIT 1
```

### home.php — Order KPIs
```sql
SELECT
  COUNT(*) AS orders_count,
  SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
  COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount_aed ELSE 0 END), 0) AS paid_amount
FROM checkout_orders
WHERE media_buyer_id = ?
```

### home.php — Visit KPIs
```sql
SELECT
  COUNT(*) AS visits,
  COUNT(DISTINCT session_token) AS unique_sessions,
  COALESCE(AVG(NULLIF(duration_seconds, 0)), 0) AS avg_duration
FROM media_buyer_visits
WHERE media_buyer_id = ?
```

### home.php — Attribution KPIs
```sql
SELECT
  COUNT(*) AS attribution_count,
  COUNT(DISTINCT visitor_id) AS visitors_count,
  SUM(CASE WHEN converted_checkout_order_id IS NOT NULL THEN 1 ELSE 0 END) AS conversions_count
FROM marketing_attributions
WHERE media_buyer_id = ?
  AND expires_at >= NOW()
```

### home.php — Tracking link generation
```php
$campaign = media_buyer_default_campaign($pdo, $media_buyer_id);
$homeLink    = media_buyer_tracking_url($campaign, '/');
$pricingLink = media_buyer_tracking_url($campaign, '/#pricing');
$checkoutLink  = media_buyer_tracking_url($campaign, '/checkout.php?plan=single');
$monthlyLink   = media_buyer_tracking_url($campaign, '/checkout.php?plan=monthly');
$bundleLink    = media_buyer_tracking_url($campaign, '/checkout.php?plan=bundle');
```

### stats.php — Commissions (last 20)
```sql
SELECT * FROM media_buyer_commissions
WHERE media_buyer_id = ?
ORDER BY created_at DESC
LIMIT 20
```

### stats.php — Traffic sources
```sql
SELECT source_label, COUNT(*) AS total
FROM media_buyer_visits
WHERE media_buyer_id = ?
GROUP BY source_label
ORDER BY total DESC
LIMIT 8
```

### stats.php — Device breakdown
```sql
SELECT device_type, COUNT(*) AS total
FROM media_buyer_visits
WHERE media_buyer_id = ?
GROUP BY device_type
ORDER BY total DESC
```

### stats.php — Recent visits (last 20)
```sql
SELECT first_seen_at, source_label, device_type, country, duration_seconds, last_path, last_event
FROM media_buyer_visits
WHERE media_buyer_id = ?
ORDER BY first_seen_at DESC
LIMIT 20
```

---

## Backend API Files to Build

### `backend/api/media-buyer/home.php`
**Method:** GET  
**Auth:** `$_SESSION['media_buyer_id']` + `portals_ensure_schema` + `media_buyer_ensure_schema`  
**Agreement check:** check active template vs accepted — if not accepted, return `json_err('agreement_required', 403)`  
**Returns:**
```json
{
  "ok": true,
  "buyer": { "id": 1, "full_name": "...", "commission_rate": "5.00" },
  "kpis": {
    "orders_count": 42,
    "paid_count": 38,
    "paid_amount": 3040.00,
    "visits": 1200,
    "unique_sessions": 980,
    "avg_duration": 47,
    "visitors_count": 210,
    "attribution_count": 18,
    "conversions_count": 9
  },
  "links": {
    "home": "https://mshabibanabil.com/?ref=...",
    "pricing": "https://mshabibanabil.com/#pricing?ref=...",
    "checkout_single": "https://mshabibanabil.com/checkout.php?plan=single&ref=...",
    "checkout_monthly": "https://mshabibanabil.com/checkout.php?plan=monthly&ref=...",
    "checkout_bundle": "https://mshabibanabil.com/checkout.php?plan=bundle&ref=..."
  }
}
```

### `backend/api/media-buyer/stats.php`
**Method:** GET  
**Auth:** same guard  
**Returns:**
```json
{
  "ok": true,
  "commissions": [
    { "id": 1, "commission_amount_aed": "80.00", "status": "paid", "created_at": "..." }
  ],
  "sources": [
    { "source_label": "instagram", "total": 540 }
  ],
  "devices": [
    { "device_type": "mobile", "total": 900 }
  ],
  "recent_visits": [
    { "first_seen_at": "...", "source_label": "tiktok", "device_type": "mobile", "country": "AE", "duration_seconds": 63, "last_path": "/checkout.php", "last_event": "purchase" }
  ]
}
```

### `backend/api/media-buyer/notifications.php`
**GET:** list + unread count  
**POST:** mark all as read  
**Returns GET:**
```json
{
  "ok": true,
  "notifications": [{ "id": 1, "title": "...", "body": "...", "url": null, "action_label": null, "read_at": null, "created_at": "..." }],
  "unread_count": 2
}
```

### `backend/api/media-buyer/agreement.php`
**GET:** active template (id, version, content)  
**POST:** accept with `typed_name` body  
**Returns GET:**
```json
{
  "ok": true,
  "template": { "id": 1, "version": "v1.0", "content": "Agreement text..." },
  "already_accepted": false
}
```
**Returns POST:** `{ "ok": true }`

---

## Frontend Features

### Feature Folder Structure
```
frontend/src/roles/media-buyer/
├── components/
│   └── MediaBuyerLayout.tsx      ← header + nav tabs (4 tabs)
├── features/
│   ├── dashboard/                ← KPI strip + quick overview
│   ├── tracking/                 ← Tracking links + copy-to-clipboard
│   ├── campaigns/                ← Visit analytics (sources, devices, recent)
│   ├── commissions/              ← Commission ledger
│   └── notifications/            ← Push notifications
├── index.tsx                     ← Router (5 routes + agreement route)
└── README.md
```

### Layout Nav Tabs (4)
```
/media-buyer              → الرئيسية (Dashboard)
/media-buyer/tracking     → الروابط (Tracking Links)
/media-buyer/campaigns    → الحملات (Campaigns/Analytics)
/media-buyer/commissions  → العمولات (Commissions)
```
Notifications: accessible via header icon (not a tab).

### Routes
```
/media-buyer                → MediaBuyerDashboardPage
/media-buyer/tracking       → TrackingPage
/media-buyer/campaigns      → CampaignsPage
/media-buyer/commissions    → CommissionsPage
/media-buyer/notifications  → MediaBuyerNotificationsPage
/media-buyer/agreement      → AgreementPage  (no nav, shown pre-dashboard)
```

---

## TypeScript Types

### `features/dashboard/types.ts`
```typescript
export interface MediaBuyerProfile {
  id: number
  full_name: string
  commission_rate: string | null
}

export interface MediaBuyerKPIs {
  orders_count: number
  paid_count: number
  paid_amount: number
  visits: number
  unique_sessions: number
  avg_duration: number
  visitors_count: number
  attribution_count: number
  conversions_count: number
}

export interface TrackingLinks {
  home: string
  pricing: string
  checkout_single: string
  checkout_monthly: string
  checkout_bundle: string
}

export interface MediaBuyerHomeData {
  buyer: MediaBuyerProfile
  kpis: MediaBuyerKPIs
  links: TrackingLinks
}
```

### `features/tracking/types.ts`
```typescript
export type { TrackingLinks, MediaBuyerHomeData } from '../dashboard/types'
```

### `features/campaigns/types.ts`
```typescript
export interface SourceBreakdown {
  source_label: string
  total: number
}

export interface DeviceBreakdown {
  device_type: string
  total: number
}

export interface VisitRow {
  first_seen_at: string
  source_label: string
  device_type: string
  country: string
  duration_seconds: number
  last_path: string
  last_event: string
}

export interface MediaBuyerStatsData {
  commissions: CommissionRow[]
  sources: SourceBreakdown[]
  devices: DeviceBreakdown[]
  recent_visits: VisitRow[]
}
```

### `features/commissions/types.ts`
```typescript
export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

export interface CommissionRow {
  id: number
  commission_amount_aed: string
  status: CommissionStatus
  created_at: string
}
```

### `features/notifications/types.ts`
```typescript
export interface MediaBuyerNotification {
  id: number
  title: string
  body: string
  url: string | null
  action_label: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationsData {
  notifications: MediaBuyerNotification[]
  unread_count: number
}
```

### `features/agreement/types.ts`
```typescript
export interface AgreementTemplate {
  id: number
  version: string
  content: string
}

export interface AgreementData {
  template: AgreementTemplate
  already_accepted: boolean
}
```

---

## Component Plan

### `MediaBuyerLayout.tsx`
- Sticky header: "ميديا باير" brand + role badge "شريك تسويقي"
- Nav tabs: 4 tabs with NavLink active border-bottom style
- English terms where applicable (tracking/campaigns are marketing terms)

### Dashboard Feature
| Component | Purpose |
|-----------|---------|
| `KPIStrip.tsx` | 9 animated KPI cards in 3×3 grid |
| `MediaBuyerDashboardPage.tsx` | Welcome header + KPI strip + quick "view links" CTA |

### Tracking Feature
| Component | Purpose |
|-----------|---------|
| `TrackingLinkRow.tsx` | Label + read-only input + copy button with feedback |
| `TrackingPage.tsx` | 5 tracking link rows |

Copy pattern:
```typescript
const copy = async (url: string) => {
  try { await navigator.clipboard.writeText(url) }
  catch { /* textarea fallback */ }
  setCopied(url)
  setTimeout(() => setCopied(null), 1500)
}
```

### Campaigns Feature
| Component | Purpose |
|-----------|---------|
| `SourceBreakdownList.tsx` | Ranked list of traffic sources |
| `DeviceBreakdownList.tsx` | Ranked list of device types |
| `RecentVisitsTable.tsx` | Table: time, source, device, country, duration, last page |
| `CampaignsPage.tsx` | Composes all 3 panels |

### Commissions Feature
| Component | Purpose |
|-----------|---------|
| `CommissionStatusBadge.tsx` | pending→warning-bg, paid→success-bg, cancelled→danger-bg |
| `CommissionLedger.tsx` | Table rows (amount, status, date) |
| `CommissionsPage.tsx` | Header + empty state + ledger |

### Notifications Feature
| Component | Purpose |
|-----------|---------|
| `NotificationCard.tsx` | Card with unread border + action link |
| `MediaBuyerNotificationsPage.tsx` | List + "تحديد الكل كمقروء" button |

### Agreement Feature
| Component | Purpose |
|-----------|---------|
| `AgreementPage.tsx` | Content scroll box + typed_name input + accept button |

Agreement page is shown at `/media-buyer/agreement` and redirected to from the auth guard if needed. After acceptance, navigate to `/media-buyer`.

---

## Agreement Gate Strategy

The PHP backend checks the agreement on every dashboard request and returns `403 agreement_required`. In the React frontend:

1. On mount, `home.php` is called
2. If it returns `{ ok: false, error: 'agreement_required' }`, the dashboard query's error handler redirects to `/media-buyer/agreement`
3. `AgreementPage` fetches the template from `agreement.php GET`, displays it, collects typed name, posts to `agreement.php POST`
4. On success, navigate to `/media-buyer` (which re-triggers home.php, now succeeds)

---

## API File Templates

### `home.php`
```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/media-buyer.php';

start_session();
portals_ensure_schema($pdo);

if (empty($_SESSION['media_buyer_id'])) {
    json_err('Unauthorized', 401);
}

$id = (int)$_SESSION['media_buyer_id'];
media_buyer_ensure_schema($pdo);

// buyer
$stmt = $pdo->prepare("SELECT id, full_name, commission_rate FROM media_buyers WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$buyer = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$buyer) { json_err('Not found', 404); }

// agreement check
$activeTemplate = $pdo->query("SELECT id, requires_reacceptance FROM media_buyer_agreement_templates WHERE active = 1 ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC) ?: ['id'=>0,'requires_reacceptance'=>0];
$acc = $pdo->prepare("SELECT template_id FROM media_buyer_agreement_acceptances WHERE media_buyer_id = ? ORDER BY accepted_at DESC LIMIT 1");
$acc->execute([$id]);
$acceptedId = (int)($acc->fetchColumn() ?: 0);
if (!$acceptedId || ((int)$activeTemplate['requires_reacceptance'] === 1 && $acceptedId !== (int)$activeTemplate['id'])) {
    json_err('agreement_required', 403);
}

// order KPIs
$s1 = $pdo->prepare("SELECT COUNT(*) AS orders_count, SUM(CASE WHEN payment_status='paid' THEN 1 ELSE 0 END) AS paid_count, COALESCE(SUM(CASE WHEN payment_status='paid' THEN amount_aed ELSE 0 END),0) AS paid_amount FROM checkout_orders WHERE media_buyer_id=?");
$s1->execute([$id]);
$orders = $s1->fetch(PDO::FETCH_ASSOC) ?: ['orders_count'=>0,'paid_count'=>0,'paid_amount'=>0];

// visit KPIs
$s2 = $pdo->prepare("SELECT COUNT(*) AS visits, COUNT(DISTINCT session_token) AS unique_sessions, COALESCE(AVG(NULLIF(duration_seconds,0)),0) AS avg_duration FROM media_buyer_visits WHERE media_buyer_id=?");
$s2->execute([$id]);
$visits = $s2->fetch(PDO::FETCH_ASSOC) ?: ['visits'=>0,'unique_sessions'=>0,'avg_duration'=>0];

// attribution KPIs
$s3 = $pdo->prepare("SELECT COUNT(*) AS attribution_count, COUNT(DISTINCT visitor_id) AS visitors_count, SUM(CASE WHEN converted_checkout_order_id IS NOT NULL THEN 1 ELSE 0 END) AS conversions_count FROM marketing_attributions WHERE media_buyer_id=? AND expires_at>=NOW()");
$s3->execute([$id]);
$attr = $s3->fetch(PDO::FETCH_ASSOC) ?: ['attribution_count'=>0,'visitors_count'=>0,'conversions_count'=>0];

// tracking links
$campaign  = media_buyer_default_campaign($pdo, $id);
$links = [
    'home'             => media_buyer_tracking_url($campaign, '/'),
    'pricing'          => media_buyer_tracking_url($campaign, '/#pricing'),
    'checkout_single'  => media_buyer_tracking_url($campaign, '/checkout.php?plan=single'),
    'checkout_monthly' => media_buyer_tracking_url($campaign, '/checkout.php?plan=monthly'),
    'checkout_bundle'  => media_buyer_tracking_url($campaign, '/checkout.php?plan=bundle'),
];

json_ok([
    'buyer' => ['id' => (int)$buyer['id'], 'full_name' => $buyer['full_name'], 'commission_rate' => $buyer['commission_rate']],
    'kpis' => [
        'orders_count'     => (int)$orders['orders_count'],
        'paid_count'       => (int)$orders['paid_count'],
        'paid_amount'      => (float)$orders['paid_amount'],
        'visits'           => (int)$visits['visits'],
        'unique_sessions'  => (int)$visits['unique_sessions'],
        'avg_duration'     => (int)round((float)$visits['avg_duration']),
        'visitors_count'   => (int)$attr['visitors_count'],
        'attribution_count'=> (int)$attr['attribution_count'],
        'conversions_count'=> (int)$attr['conversions_count'],
    ],
    'links' => $links,
]);
```

### `stats.php`
```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/media-buyer.php';

start_session();
portals_ensure_schema($pdo);
if (empty($_SESSION['media_buyer_id'])) { json_err('Unauthorized', 401); }
$id = (int)$_SESSION['media_buyer_id'];
media_buyer_ensure_schema($pdo);

// commissions
$c = $pdo->prepare("SELECT id, commission_amount_aed, status, created_at FROM media_buyer_commissions WHERE media_buyer_id=? ORDER BY created_at DESC LIMIT 20");
$c->execute([$id]);
$commissions = $c->fetchAll(PDO::FETCH_ASSOC) ?: [];

// sources
$s = $pdo->prepare("SELECT source_label, COUNT(*) AS total FROM media_buyer_visits WHERE media_buyer_id=? GROUP BY source_label ORDER BY total DESC LIMIT 8");
$s->execute([$id]);
$sources = $s->fetchAll(PDO::FETCH_ASSOC) ?: [];

// devices
$d = $pdo->prepare("SELECT device_type, COUNT(*) AS total FROM media_buyer_visits WHERE media_buyer_id=? GROUP BY device_type ORDER BY total DESC");
$d->execute([$id]);
$devices = $d->fetchAll(PDO::FETCH_ASSOC) ?: [];

// recent visits
$v = $pdo->prepare("SELECT first_seen_at, source_label, device_type, country, duration_seconds, last_path, last_event FROM media_buyer_visits WHERE media_buyer_id=? ORDER BY first_seen_at DESC LIMIT 20");
$v->execute([$id]);
$recent_visits = $v->fetchAll(PDO::FETCH_ASSOC) ?: [];

json_ok([
    'commissions'   => $commissions,
    'sources'       => $sources,
    'devices'       => $devices,
    'recent_visits' => $recent_visits,
]);
```

---

## File List (Estimated ~48 files)

### Backend (4 files)
```
backend/api/media-buyer/home.php
backend/api/media-buyer/stats.php
backend/api/media-buyer/notifications.php
backend/api/media-buyer/agreement.php
```

### Frontend (~44 files)
```
components/
  MediaBuyerLayout.tsx

features/dashboard/
  types.ts
  api.ts
  animations.ts
  hooks/useMediaBuyerHome.ts
  components/KPIStrip.tsx
  MediaBuyerDashboardPage.tsx
  index.tsx
  README.md

features/tracking/
  types.ts
  api.ts                         ← re-exports from dashboard/api
  animations.ts
  hooks/useTrackingLinks.ts      ← re-uses useMediaBuyerHome
  components/TrackingLinkRow.tsx
  TrackingPage.tsx
  index.tsx
  README.md

features/campaigns/
  types.ts
  api.ts
  animations.ts
  hooks/useMediaBuyerStats.ts
  components/SourceBreakdownList.tsx
  components/DeviceBreakdownList.tsx
  components/RecentVisitsTable.tsx
  CampaignsPage.tsx
  index.tsx
  README.md

features/commissions/
  types.ts
  api.ts                         ← re-uses stats endpoint
  animations.ts
  hooks/useCommissions.ts        ← re-uses useMediaBuyerStats
  components/CommissionStatusBadge.tsx
  components/CommissionLedger.tsx
  CommissionsPage.tsx
  index.tsx
  README.md

features/notifications/
  types.ts
  api.ts
  animations.ts
  hooks/useMediaBuyerNotifications.ts
  components/NotificationCard.tsx
  MediaBuyerNotificationsPage.tsx
  index.tsx
  README.md

features/agreement/
  types.ts
  api.ts
  hooks/useAgreement.ts
  AgreementPage.tsx
  index.tsx
  README.md

index.tsx                        ← 6 routes
README.md
```

---

## Key Implementation Notes

1. **stats.php serves both campaigns + commissions** — `useMediaBuyerStats` is shared; `CampaignsPage` uses sources/devices/recent_visits; `CommissionsPage` uses commissions array only.

2. **Tracking links are in home.php** — `TrackingPage` re-uses `useMediaBuyerHome` hook (same data, no extra API call).

3. **Agreement gate**: If `home.php` returns 403 with `error: 'agreement_required'`, TanStack Query's `onError` in `useMediaBuyerHome` triggers navigate to `/media-buyer/agreement`. After POST accept, navigate to `/media-buyer`.

4. **Copy-to-clipboard pattern** (re-used from Owner portal):
```typescript
const copy = async (text: string) => {
  try { await navigator.clipboard.writeText(text) }
  catch {
    const ta = document.createElement('textarea')
    ta.value = text; document.body.appendChild(ta); ta.select()
    document.execCommand('copy'); document.body.removeChild(ta)
  }
  setCopied(text); setTimeout(() => setCopied(null), 1500)
}
```

5. **Commission status badge tokens:**
   - `pending` → `--warning-bg` / `--warning`
   - `paid` → `--success-bg` / `--success`
   - `cancelled` → `--danger-bg` / `--danger`

6. **KPI card labels (Arabic):**
   - orders_count → "الطلبات المنسوبة"
   - paid_count → "الطلبات المدفوعة"
   - paid_amount → "إجمالي المدفوع (AED)"
   - visits → "فتح الروابط"
   - unique_sessions → "الجلسات المتتبعة"
   - avg_duration → "متوسط الوقت (ث)"
   - visitors_count → "الزوار (30 يوم)"
   - attribution_count → "النسب النشطة"
   - conversions_count → "التحويلات المنسوبة"

7. **No CSRF on GET** — only needed on agreement POST if implementing. Can use simple POST with JSON body (no CSRF token needed for API endpoints; CSRF is for form-based PHP).

8. **Agreement content** is pre-rendered text from DB — display with `whitespace-pre-wrap` styling.

9. **Backend lib path double-nesting confirmed:** `__DIR__ . '/../../lib/lib/helpers.php'` (not `../../lib/helpers.php`)
