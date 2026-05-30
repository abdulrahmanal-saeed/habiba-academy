# Sprint 6.3 Analysis — Academies + Media Buyers + Book Launch
> Phase 6 Owner Portal | Generated 2026-05-20

---

## Overview

Sprint 6.3 builds three Owner features:

| Feature | Route | Source PHP |
|---------|-------|------------|
| Academies Management | `/owner/academies` | `New/Owner/Academy management/owner/academies/index.php` |
| Academy Briefs | `/owner/academy-briefs` | `New/Owner/Academy briefs management/owner/academy-briefs/index.php` + `detail.php` |
| Media Buyers | `/owner/media-buyers` | `New/Owner/Media buyer management/owner/media-buyers/index.php` |
| Media Buyer Agreement | `/owner/media-buyers/agreement` | `New/Owner/Media buyer agreements/owner/media-buyers/agreement.php` |
| Book Launch Control | `/owner/book-launch` | `New/Owner/Book launch control/teacher-book-launch-control.php` |
| Book Activation Requests | `/owner/book-launch/requests` | `New/Owner/Book activation requests/teacher-book-activation-requests.php` |

---

## Feature 1 — Academies Management

### What it does
The owner manages external academy partners: create academy records, link students to academies, assign access codes, and track status. Academy briefs (student leads submitted by academy partners) are reviewed and converted to enrolled students.

### PHP source: `academies/index.php`

**Dependencies:**
- `lib/roles-portals.php` → `portals_ensure_schema()`, `portals_students()`, `portals_generate_access_code()`, `portals_sync_links()`, `portals_status_options()`, `portals_badge()`

**Database tables:**
- `academies` — id, name, contact_name, email, whatsapp, status, notes, access_code, created_at, updated_at
- `academy_students` — academy_id, student_id, status (pivot table)
- `students` — existing table (read only)

**GET — List academies:**
```sql
SELECT a.*,
       COUNT(ast.student_id) AS student_count,
       GROUP_CONCAT(CONCAT(st.full_name, ' (', st.login_code, ')') ...) AS students
FROM academies a
LEFT JOIN academy_students ast ON ast.academy_id = a.id AND ast.status = 'active'
LEFT JOIN students st ON st.id = ast.student_id
GROUP BY a.id
ORDER BY a.created_at DESC
```
Returns: `id`, `name`, `contact_name`, `email`, `whatsapp`, `status`, `notes`, `access_code`, `created_at`, `student_count`, `students` (CSV string)

**POST — Create academy:**
- Validates CSRF token
- Required: `name`
- Optional: `contact_name`, `email`, `whatsapp`, `status` (active/paused/inactive), `notes`
- `student_ids[]` — array of student IDs to link
- Auto-generates `access_code` via `portals_generate_access_code('AC')` → e.g. `AC-123456`
- Inserts into `academies`, then `portals_sync_links()` re-syncs `academy_students`

### PHP source: `academy-briefs/index.php`

**Dependencies:** `lib/student-briefs.php` → `ensure_student_brief_tables()`

**GET — List briefs:**
```sql
SELECT b.*, a.name AS academy_name
FROM student_briefs b
LEFT JOIN academies a ON a.id = b.academy_id
ORDER BY b.created_at DESC, b.id DESC
```
Returns: all brief fields + `academy_name`

**No POST on index** — listing only, detail page handles updates.

### PHP source: `academy-briefs/detail.php`

**Dependencies:** `lib/student-briefs.php`, `lib/platform-notifications.php`, `lib/learning-audit.php`

**GET — Single brief:**
```sql
SELECT b.*, a.name AS academy_name
FROM student_briefs b
LEFT JOIN academies a ON a.id = b.academy_id
WHERE b.id = ?
```

**POST — Update brief status:**
- Fields: `brief_status` (enum: submitted | under_review | needs_more_info | accepted | converted_to_student | rejected | archived), `owner_notes`
- Special logic: if status = `converted_to_student`, sets `conversion_status = 'converted'` and `converted_at = NOW()`
- Side effects:
  - `platform_notify()` → notifies the academy (role=`academy`, user_id=`brief.academy_id`)
  - `learning_audit()` → logs `academy_brief_status_changed`

**Brief fields (from DB):**
`student_name`, `age`, `nationality`, `native_language`, `main_goal`, `learning_reason`, `speaking_ability`, `reading_writing_ability`, `parent_contact_info`, `preferred_schedule`, `additional_notes`, `academy_id`, `source_name`, `brief_status`, `owner_notes`, `conversion_status`, `converted_at`, `created_at`

---

## Feature 2 — Media Buyers Management

### What it does
The owner manages media buyer partners: create profiles with commission rates, view performance stats (visits, attributions, paid orders, revenue), and maintain the legal agreement template. Media buyers get access codes to log into their own dashboard.

### PHP source: `media-buyers/index.php`

**Dependencies:**
- `lib/roles-portals.php` → schema + helpers
- `lib/media-buyer.php` → `media_buyer_ensure_schema()`

**Database tables (from media-buyer.php schema):**
- `media_buyers` — id, full_name, email, whatsapp, commission_rate, status, notes, access_code, created_at, updated_at
- `media_buyer_campaigns` — id, media_buyer_id, name, tracking_code, utm_source, utm_medium, utm_campaign, status, created_at
- `media_buyer_visits` — session-level tracking rows with UTM, device, country, ip_hash, user_agent_hash
- `media_buyer_pageviews` — page-level events per visit
- `marketing_attributions` — visitor attribution with 30-day cookie expiry
- `media_buyer_commissions` — pending/paid commission rows per checkout_order
- `media_buyer_agreement_templates` — versioned contract text
- `media_buyer_agreement_acceptances` — signed copies per media buyer
- `checkout_orders` (extended) — adds media_buyer_id, media_campaign_id, attribution_code, utm_* columns

**GET — List media buyers with stats:**
```sql
SELECT mb.*,
       COUNT(DISTINCT v.id) AS visits_count,
       COUNT(DISTINCT ma.visitor_id) AS attributed_visitors,  -- 30-day active attributions
       COUNT(DISTINCT CASE WHEN co.payment_status = 'paid' THEN co.id END) AS paid_orders_count,
       COALESCE(SUM(DISTINCT CASE WHEN co.payment_status = 'paid' THEN co.amount_aed ELSE 0 END), 0) AS paid_amount
FROM media_buyers mb
LEFT JOIN media_buyer_visits v ON v.media_buyer_id = mb.id
LEFT JOIN marketing_attributions ma ON ma.media_buyer_id = mb.id AND ma.expires_at >= NOW()
LEFT JOIN checkout_orders co ON co.media_buyer_id = mb.id
GROUP BY mb.id
ORDER BY mb.created_at DESC
```
Returns per buyer: `visits_count`, `attributed_visitors` (active 30-day), `paid_orders_count`, `paid_amount` (AED)

**POST — Create media buyer:**
- Required: `full_name`
- Optional: `email`, `whatsapp`, `commission_rate` (decimal %), `status`, `notes`
- Auto-generates `access_code` via `portals_generate_access_code('MB')` → e.g. `MB-123456`
- Note: No update/delete in this PHP — add-only from owner side. Existing buyers shown read-only.

### PHP source: `media-buyers/agreement.php`

**Dependencies:** `lib/media-buyer.php`, `lib/learning-audit.php`

**GET — Load active template:**
```sql
SELECT * FROM media_buyer_agreement_templates WHERE active = 1 ORDER BY id DESC LIMIT 1
```

**POST — Save new version:**
- Required: `title`, `version`, `content` all non-empty
- First deactivates all existing: `UPDATE media_buyer_agreement_templates SET active = 0`
- Inserts new active template with `requires_reacceptance` flag
- Logs to audit: `media_buyer_agreement_template_updated`
- Each save creates a NEW version row (immutable history pattern)

**Template fields:** `title`, `version`, `content` (MEDIUMTEXT), `requires_reacceptance` (bool)

---

## Feature 3 — Book Launch Control

### What it does
The owner controls when and how the Interactive Arabic Book is visible to students. Supports full launch, pause, hide, and granular component toggles. Shows a readiness checklist and full audit log of all launch changes.

### PHP source: `teacher-book-launch-control.php`

**Dependencies:** `lib/book-sales.php` → `book_sales_ensure_schema()`, all `book_sales_*` functions

**Database tables:**
- `books` — existing book record (via `interactive_books_ensure_schema`)
- `book_launch_settings` — one row per book_id, all toggle fields
- `book_launch_audit_log` — immutable log of every status change
- `book_packages` — AED 80 package with teacher_feedback + extra_review_session
- `book_activation_requests` — pending student requests
- `student_book_access` — active student access rows

**GET — Load page data:**
1. Resolve `$bookId` from GET param or auto-detect beginner book
2. `book_sales_launch_settings($pdo, $bookId)` → current settings row
3. `book_sales_launch_status_label()` → `[statusEn, statusAr, badgeClass]`
4. KPI queries:
   - `COUNT(*) FROM student_book_access WHERE access_status = 'active'` → `$activeAccess`
   - `COUNT(*) FROM book_activation_requests WHERE status = 'pending'` → `$pendingRequests`
5. `book_sales_package($pdo, $bookId)` → package row (price, includes_*)
6. Readiness checklist — 17 items checked live against DB:
   - `book_units` counts by type (cover, intro_page, lesson, final_review, ending_page, back_cover)
   - Specific slug checks (review-1-lessons-1-to-4, review-2-lessons-5-to-8)
   - Package price check: `price === 80`
   - Package flag checks: `includes_teacher_feedback === 1`, `includes_extra_review_session === 1`
   - 6 manual items hardcoded to `false` (testing steps)
7. Audit log: last 12 rows from `book_launch_audit_log ORDER BY created_at DESC`

**POST — 4 action modes:**

| `action` | Effect |
|----------|--------|
| `launch` | All marketing + sales toggles ON, `student_visibility_status = 'launched'` |
| `hide` | All toggles OFF, `student_visibility_status = 'teacher_preview_only'` |
| `pause` | All toggles OFF, `student_visibility_status = 'paused'`, preserves notification flags from current |
| `save` (default) | Granular save of all checkboxes + `student_visibility_status` from form, with optional `change_note` |

All POSTs call `book_sales_save_launch_settings()` which:
1. Validates status against allowlist
2. Upserts `book_launch_settings`
3. Sets `launched_at + launched_by` on first launch
4. Calls `book_sales_log_launch_change()` → inserts audit log row

**Launch settings fields (14 toggles + 1 enum):**
```
student_visibility_status: hidden | teacher_preview_only | coming_soon | launched | paused
dashboard_card_enabled
fixed_icon_enabled
login_banner_enabled
homework_popup_enabled
feedback_popup_enabled
product_page_enabled
preview_enabled
checkout_enabled
locked_cta_enabled
coming_soon_card_enabled
marketing_notifications_enabled
activation_notifications_enabled
submission_feedback_notifications_enabled
allow_existing_access_when_paused
```

**UI component groupings:**
- Marketing Components: dashboard_card, fixed_icon, login_banner, homework_popup, feedback_popup, locked_cta
- Sales / Access Components: product_page, preview, checkout, allow_existing_access_when_paused
- Notifications: coming_soon_card, marketing_notifications, activation_notifications, submission_feedback_notifications

### PHP source: `teacher-book-activation-requests.php`

**Dependencies:** `lib/book-sales.php`

**GET — List requests:**
```sql
SELECT r.*, s.full_name, s.login_code, b.title_en AS book_title, p.title_en AS package_title
FROM book_activation_requests r
JOIN students s ON s.id = r.student_id
JOIN books b ON b.id = r.book_id
JOIN book_packages p ON p.id = r.package_id
[WHERE r.status = ?]
ORDER BY r.created_at DESC LIMIT 300
```
Filter by status: pending | approved | rejected | needs_more_info

**POST — Handle request:**

| `action` | Function called | Effect |
|----------|----------------|--------|
| `approve` | `book_sales_approve_request()` | Inserts/upserts `student_book_access`, marks request approved, sends student FCM notification |
| `rejected` | `book_sales_update_request_status()` | Updates status, sends student notification |
| `needs_more_info` | `book_sales_update_request_status()` | Updates status, sends student notification |

---

## Backend API Design (New PHP files to create)

All new endpoints go in `backend/api/owner/` and follow the existing REST JSON pattern.

### `academies.php`

```
GET  /api/owner/academies          → list all academies with student_count + students list
POST /api/owner/academies
  action=save      → create (no edit UI needed for MVP — add-only)
  action=delete    → soft delete (set status=inactive)
  action=update_students → resync academy_students pivot for existing academy
```

**GET response shape:**
```typescript
interface Academy {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  whatsapp: string | null
  status: 'active' | 'paused' | 'inactive'
  notes: string | null
  access_code: string | null
  created_at: string
  student_count: number
  students: string  // CSV "Name (CODE), Name2 (CODE2)"
}
```

**POST FormData fields:**
- `action=save`: `name` (required), `contact_name`, `email`, `whatsapp`, `status`, `notes`, `student_ids[]`
- `action=delete`: `academy_id`

### `academy-briefs.php`

```
GET  /api/owner/academy-briefs              → paginated list (all briefs + academy_name)
GET  /api/owner/academy-briefs?id=N         → single brief detail
POST /api/owner/academy-briefs
  action=update_status → brief_status + owner_notes + id
```

**Brief statuses:** `submitted | under_review | needs_more_info | accepted | converted_to_student | rejected | archived`

### `media-buyers.php`

```
GET  /api/owner/media-buyers              → list all with stats
POST /api/owner/media-buyers
  action=save      → create media buyer (name, email, whatsapp, commission_rate, status, notes)
  action=delete    → soft delete
GET  /api/owner/media-buyers?action=agreement  → load active template
POST /api/owner/media-buyers
  action=save_agreement → title, version, content, requires_reacceptance
```

**GET response per buyer:**
```typescript
interface MediaBuyer {
  id: number
  full_name: string
  email: string | null
  whatsapp: string | null
  commission_rate: number | null   // percentage e.g. 10.00
  status: 'active' | 'paused' | 'inactive'
  notes: string | null
  access_code: string | null
  created_at: string
  // stats from JOIN
  visits_count: number
  attributed_visitors: number   // active 30-day attributions
  paid_orders_count: number
  paid_amount: number           // AED decimal
}
```

### `book-launch.php`

```
GET  /api/owner/book-launch              → settings + readiness + KPIs + audit log
POST /api/owner/book-launch
  action=launch    → full launch preset
  action=hide      → hide preset
  action=pause     → pause preset
  action=save      → granular settings save
GET  /api/owner/book-launch?sub=requests → activation requests list
POST /api/owner/book-launch
  action=approve_request    → request_id, admin_note
  action=reject_request     → request_id, admin_note
  action=needs_more_info    → request_id, admin_note
```

**GET /book-launch response:**
```typescript
interface BookLaunchData {
  book: { id: number; title_en: string; title_ar: string }
  settings: BookLaunchSettings    // all 14 toggles + status
  status: { en: string; ar: string; badge: string }
  kpis: {
    active_access: number
    pending_requests: number
    readiness_count: number
    readiness_total: number
  }
  readiness: Array<{ label: string; done: boolean }>
  audit_log: Array<{
    id: number
    old_status: string
    new_status: string
    change_note: string
    created_at: string
  }>
}

interface BookLaunchSettings {
  student_visibility_status: 'hidden' | 'teacher_preview_only' | 'coming_soon' | 'launched' | 'paused'
  dashboard_card_enabled: boolean
  fixed_icon_enabled: boolean
  login_banner_enabled: boolean
  homework_popup_enabled: boolean
  feedback_popup_enabled: boolean
  product_page_enabled: boolean
  preview_enabled: boolean
  checkout_enabled: boolean
  locked_cta_enabled: boolean
  coming_soon_card_enabled: boolean
  marketing_notifications_enabled: boolean
  activation_notifications_enabled: boolean
  submission_feedback_notifications_enabled: boolean
  allow_existing_access_when_paused: boolean
}
```

---

## Frontend Architecture Plan

### New routes to add in `frontend/src/roles/owner/index.tsx`

```
/owner/academies                → AcademiesPage
/owner/academy-briefs           → AcademyBriefsPage
/owner/academy-briefs/:id       → AcademyBriefDetailPage
/owner/media-buyers             → MediaBuyersPage
/owner/book-launch              → BookLaunchPage
/owner/book-launch/requests     → BookActivationRequestsPage
```

### Feature folders

```
frontend/src/roles/owner/features/
  academies/
    index.ts
    AcademiesPage.tsx          ← two-column: form + table
    components/
      AcademyForm.tsx           ← name, contact, email, whatsapp, status, student multi-select, notes
      AcademiesTable.tsx        ← name, student_count, access_code, status badge
    hooks/useAcademies.ts
    api.ts
    types.ts
    animations.ts
    README.md

  academy-briefs/
    index.ts
    AcademyBriefsPage.tsx      ← filterable list
    AcademyBriefDetailPage.tsx  ← detail view + status editor
    components/
      BriefStatusBadge.tsx
      BriefDetailCard.tsx       ← all 10 brief fields in 2-column grid
      BriefStatusForm.tsx       ← status select + owner notes + save
    hooks/useAcademyBriefs.ts
    api.ts
    types.ts
    animations.ts
    README.md

  media-buyers/
    index.ts
    MediaBuyersPage.tsx        ← two-column: form + table
    MediaBuyerAgreementPage.tsx ← standalone agreement editor
    components/
      MediaBuyerForm.tsx        ← name, email, whatsapp, commission_rate, status, notes
      MediaBuyersTable.tsx      ← name, stats (visits/attributed/orders/AED), commission%, status
      AgreementEditor.tsx       ← title, version, content textarea, requires_reacceptance
    hooks/useMediaBuyers.ts
    api.ts
    types.ts
    animations.ts
    README.md

  book-launch/
    index.ts
    BookLaunchPage.tsx           ← KPIs + action buttons + settings form + readiness + audit
    BookActivationRequestsPage.tsx
    components/
      LaunchStatusBadge.tsx
      LaunchKPIStrip.tsx         ← 4 KPI cards (status, active access, pending, readiness)
      LaunchActionButtons.tsx    ← Launch / Hide / Pause / Preview buttons
      LaunchSettingsForm.tsx     ← visibility select + 3 grouped toggle sections
      SettingsToggleGroup.tsx    ← reusable animated checkbox group
      ReadinessChecklist.tsx     ← 17-item checklist with done/pending icons
      LaunchAuditLog.tsx         ← last 12 audit entries
      ActivationRequestsTable.tsx ← with inline approve/reject/needs-info forms
      RequestActionDrawer.tsx    ← admin note + action buttons drawer
    hooks/
      useBookLaunch.ts
      useActivationRequests.ts
    api.ts
    types.ts
    animations.ts
    README.md
```

---

## Key Implementation Notes

### Academies
1. **Student multi-select** — `portals_sync_links()` does a DELETE + re-INSERT on every save. The frontend must send the complete list of selected student IDs on each save (not a diff).
2. **Access code** — generated on create only (`AC-NNNNNN`). Read-only display, never editable.
3. **No edit** — original PHP is add-only. For MVP, owner can create academies and the table shows them. Edit can be a drawer that posts a full replace (same endpoint, add `academy_id` param).
4. **academy-briefs** are submitted by academy portal users — the owner reviews and converts them. The `Convert to Student` CTA links to `/teacher/student-add?brief_id=N` — omit this in new React; instead show a "Mark as Converted" status option which sets `converted_to_student`.

### Media Buyers
1. **Stats query** uses `SUM(DISTINCT ...)` which is unusual — preserves the original logic. In the React API this maps to `paid_amount: number`.
2. **Agreement versioning** — each save creates a NEW row and deactivates old ones. The frontend loads the single active template. There is no version history list needed in Sprint 6.3 MVP.
3. **Commission rate** — stored as a decimal percentage (e.g. `10.00` = 10%). Display as `10%` in the table. Input accepts decimal numbers.
4. **`media_buyer_commissions`** reconciliation happens via backend hook on payment — no owner UI for commission management in this sprint.

### Book Launch
1. **Single book** — the platform currently has one book (`interactive_books_beginner_book`). No book selector needed.
2. **Readiness checklist** — 11 items are DB-driven, 6 are hardcoded `false` (manual testing steps). The API returns both as `{ label: string; done: boolean }` — UI shows checkmark vs warning icon.
3. **Confirmation modal** — only required for `launch` action (shows bilingual confirmation). Hide and pause use inline confirm in original PHP — in React, use a simple `AlertDialog` from design system.
4. **Audit log** — last 12 entries only. No pagination needed. Shows: `old_status → new_status`, `change_note`, `created_at`.
5. **Backend lib path** — as documented in Sprint 5.2 memory: backend lib requires `../../lib/` (double-nested). The new `book-launch.php` will be at `backend/api/owner/book-launch.php`, so path is `../../lib/book-sales.php`.
6. **Activation requests** — initially shown on `/owner/book-launch/requests`. Filter by status (pending/approved/rejected/needs_more_info). Approve/reject inline. Admin note textarea per row.

### Shared lib patterns
- All three new backend files call `require_once __DIR__ . '/../../lib/helpers.php'` for `json_ok()`, `json_err()`, `h()`
- `portals_ensure_schema()` and `media_buyer_ensure_schema()` are idempotent — call at top of each request
- `book_sales_ensure_schema()` chains through `interactive_books_ensure_schema()` automatically

---

## TypeScript Types Summary

```typescript
// academies/types.ts
export interface Academy {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  whatsapp: string | null
  status: 'active' | 'paused' | 'inactive'
  notes: string | null
  access_code: string | null
  created_at: string
  student_count: number
  students: string
}

export interface StudentOption {
  id: number
  full_name: string
  login_code: string
  is_active: 1 | 0
}

// academy-briefs/types.ts
export type BriefStatus =
  | 'submitted'
  | 'under_review'
  | 'needs_more_info'
  | 'accepted'
  | 'converted_to_student'
  | 'rejected'
  | 'archived'

export interface AcademyBrief {
  id: number
  student_name: string
  age: string | null
  nationality: string | null
  native_language: string | null
  main_goal: string | null
  learning_reason: string | null
  speaking_ability: string | null
  reading_writing_ability: string | null
  parent_contact_info: string | null
  preferred_schedule: string | null
  additional_notes: string | null
  brief_status: BriefStatus
  owner_notes: string | null
  conversion_status: string | null
  converted_at: string | null
  created_at: string
  academy_name: string | null
  source_name: string | null
  academy_id: number | null
}

// media-buyers/types.ts
export interface MediaBuyer {
  id: number
  full_name: string
  email: string | null
  whatsapp: string | null
  commission_rate: number | null
  status: 'active' | 'paused' | 'inactive'
  notes: string | null
  access_code: string | null
  created_at: string
  visits_count: number
  attributed_visitors: number
  paid_orders_count: number
  paid_amount: number
}

export interface AgreementTemplate {
  id: number
  title: string
  version: string
  content: string
  active: 1 | 0
  requires_reacceptance: 1 | 0
  created_at: string
}

// book-launch/types.ts
export type VisibilityStatus =
  | 'hidden'
  | 'teacher_preview_only'
  | 'coming_soon'
  | 'launched'
  | 'paused'

export interface BookLaunchSettings {
  student_visibility_status: VisibilityStatus
  dashboard_card_enabled: boolean
  fixed_icon_enabled: boolean
  login_banner_enabled: boolean
  homework_popup_enabled: boolean
  feedback_popup_enabled: boolean
  product_page_enabled: boolean
  preview_enabled: boolean
  checkout_enabled: boolean
  locked_cta_enabled: boolean
  coming_soon_card_enabled: boolean
  marketing_notifications_enabled: boolean
  activation_notifications_enabled: boolean
  submission_feedback_notifications_enabled: boolean
  allow_existing_access_when_paused: boolean
}

export interface ReadinessItem {
  label: string
  done: boolean
}

export interface AuditLogEntry {
  id: number
  old_status: string
  new_status: string
  change_note: string
  created_at: string
}

export interface BookLaunchData {
  book: { id: number; title_en: string; title_ar: string }
  settings: BookLaunchSettings
  status_label: { en: string; ar: string; badge: string }
  active_access: number
  pending_requests: number
  readiness: ReadinessItem[]
  audit_log: AuditLogEntry[]
}

export type ActivationRequestStatus = 'pending' | 'approved' | 'rejected' | 'needs_more_info'

export interface ActivationRequest {
  id: number
  student_id: number
  full_name: string
  login_code: string
  book_id: number
  book_title: string
  package_id: number
  package_title: string
  price: number
  currency: string
  payment_method: string
  payment_reference: string | null
  student_notes: string | null
  status: ActivationRequestStatus
  admin_note: string | null
  created_at: string
  approved_at: string | null
}
```

---

## Sprint 6.3 File Count Estimate

| Layer | Files |
|-------|-------|
| Backend PHP | 4 (`academies.php`, `academy-briefs.php`, `media-buyers.php`, `book-launch.php`) |
| Feature: academies | ~8 |
| Feature: academy-briefs | ~10 |
| Feature: media-buyers | ~10 |
| Feature: book-launch | ~14 |
| Route update | 1 |
| **Total** | **~47** |

---

## Sprint 6.3 Completion Checklist

- [ ] `backend/api/owner/academies.php` — GET list + POST save/delete
- [ ] `backend/api/owner/academy-briefs.php` — GET list + GET detail + POST update_status
- [ ] `backend/api/owner/media-buyers.php` — GET list + POST save + GET/POST agreement
- [ ] `backend/api/owner/book-launch.php` — GET data + POST actions + GET/POST requests
- [ ] `frontend/src/roles/owner/features/academies/` — all 8 files
- [ ] `frontend/src/roles/owner/features/academy-briefs/` — all 10 files
- [ ] `frontend/src/roles/owner/features/media-buyers/` — all 10 files
- [ ] `frontend/src/roles/owner/features/book-launch/` — all 14 files
- [ ] Route updates in `frontend/src/roles/owner/index.tsx`
- [ ] TSC + ESLint clean
- [ ] Playwright tests
