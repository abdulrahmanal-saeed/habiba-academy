# Sprint 6.4 Analysis — Owner: AI Settings + AI Logs + Parents + Access Links

**Date:** 2026-05-20  
**Phase:** 6 — Owner Portal  
**Sprint:** 6.4  
**Role:** owner

---

## Source Files Analyzed

| Feature | Source File |
|---------|-------------|
| AI Settings | `New/Owner/AI settings - logs/teacher/ai-settings.php` |
| AI Logs | `New/Owner/AI settings - logs/teacher/ai-logs.php` |
| AI Health | `New/Owner/AI settings - logs/teacher/ai-health.php` |
| Access Links | `New/Owner/Owner portal - access links/owner/access-links.php` |
| Parents | `New/Owner/Parent account - child linking management/owner/parents/index.php` |

---

## 1. AI Settings — `backend/api/owner/ai-settings.php`

### Purpose
Owner-facing REST endpoint to read and update AI governance settings. Also handles connection testing.

### Lib Dependencies
```php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/ai-governance.php';
```
- `ai_governance_ensure($pdo)` — creates `ai_settings` table + seeds defaults
- `ai_governance_setting($pdo, $key, $default)` — read one setting
- `ai_governance_save_setting($pdo, $key, $value)` — upsert one setting
- `ai_governance_status($pdo)` — returns `['status' => 'configured'|'not configured'|'connection failed', 'message' => ...]`
- `ai_governance_test_connection($pdo)` — actually calls Anthropic API to verify key

### Settings Keys (all stored in `ai_settings` table)
```
ai_enabled                  '1' | '0'
ai_provider                 'anthropic' (default)
ai_model                    'claude-haiku-4-5-20251001' (default)
ai_regenerate_limit_per_day '25' (default)
ai_cost_per_1k_input        '0' (default)
ai_cost_per_1k_output       '0' (default)
```
Also read (but not edited through this form):
```
ai_connection_status        stored by test_connection()
ai_connection_checked_at    datetime string
```

### API Contract

**GET `/api/owner/ai-settings.php`**
```json
{
  "ok": true,
  "data": {
    "settings": {
      "ai_enabled": "1",
      "ai_provider": "anthropic",
      "ai_model": "claude-haiku-4-5-20251001",
      "ai_regenerate_limit_per_day": "25",
      "ai_cost_per_1k_input": "0",
      "ai_cost_per_1k_output": "0"
    },
    "api_key_status": "Configured: sk-ant-***...****",
    "connection": {
      "status": "configured",
      "message": "API key exists on the server."
    },
    "connection_checked_at": "2026-05-20 12:34:00"
  }
}
```

**POST `/api/owner/ai-settings.php` action=save**
```json
// Body:
{ "action": "save", "ai_enabled": "1", "ai_provider": "anthropic", "ai_model": "claude-haiku-4-5-20251001", "ai_regenerate_limit_per_day": "25", "ai_cost_per_1k_input": "0", "ai_cost_per_1k_output": "0" }
// Response:
{ "ok": true, "data": { "message": "Settings saved." } }
```

**POST `/api/owner/ai-settings.php` action=test_connection**
```json
// Body: { "action": "test_connection" }
// Response:
{ "ok": true, "data": { "status": "configured", "message": "Connection successful." } }
// OR
{ "ok": false, "error": "Connection failed: ..." }
```
Note: `ai_governance_test_connection()` does the actual Anthropic API call internally.

### Important Notes
- **API key is NOT returned or settable** — it lives in server environment only.
- `api_key_status` in GET response is masked: `sk-ant-***...****` format.
- Connection test calls Anthropic live — can be slow (20s timeout in lib).
- `ai_regenerate_limit_per_day` is per-feature-per-teacher-per-day, not global.

---

## 2. AI Logs — `backend/api/owner/ai-logs.php`

### Purpose
Owner can browse `ai_requests` table with optional filters. Also exposes health stats (table from ai-health.php).

### Lib Dependencies
```php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/ai-governance.php';
```
- `ai_governance_ensure($pdo)` — ensures `ai_requests` + `ai_settings` tables exist

### Database Tables Queried
- `ai_requests` — every AI call logged here
- `students` — LEFT JOIN for student names

### `ai_requests` table columns (relevant to UI)
```
id                   INT
feature_key          VARCHAR(80)    — e.g. 'homework_analysis', 'scenario_feedback'
student_id           INT NULL
teacher_id           INT NULL
model                VARCHAR(80)
status               'success'|'failed'|'cached'
cost_tokens_input    INT
cost_tokens_output   INT
estimated_cost_usd   DECIMAL(10,6)
raw_prompt           MEDIUMTEXT NULL
output_json          TEXT NULL
raw_response         MEDIUMTEXT NULL
error_message        TEXT NULL
created_at           DATETIME
```

### API Contract

**GET `/api/owner/ai-logs.php`**
- Params: `?feature=homework_analysis&status=failed`
- Status filter: `success`, `failed`, `cached` (validates with `in_array`)
- Returns last 100 rows + distinct feature keys list + health stats

```json
{
  "ok": true,
  "data": {
    "logs": [
      {
        "id": 42,
        "feature_key": "homework_analysis",
        "full_name": "Sara Ahmed",
        "student_id": 7,
        "status": "success",
        "cost_tokens_input": 320,
        "cost_tokens_output": 180,
        "estimated_cost_usd": "0.000024",
        "model": "claude-haiku-4-5-20251001",
        "raw_prompt": "...",
        "output_json": "...",
        "error_message": null,
        "created_at": "2026-05-20 14:23:11"
      }
    ],
    "features": ["homework_analysis", "scenario_feedback", "weak_words"],
    "health": {
      "total": 150,
      "success": 142,
      "failed": 6,
      "cached": 2,
      "api_key_configured": true,
      "api_key_masked": "sk-ant-***...****"
    }
  }
}
```

### Important Notes
- `raw_prompt` and `output_json` can be very long — display collapsible in UI.
- `estimated_cost_usd` is a string from DECIMAL — parse as float in TS.
- `full_name` may be null if `student_id` is null (teacher-initiated request).

---

## 3. Parents — `backend/api/owner/parents.php`

### Purpose
Create and list parent accounts linked to one or more students. Parent accounts get portal access via `access_code` (format `PR-NNNNNN`).

### Lib Dependencies
```php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
```
- `portals_ensure_schema($pdo)` — creates `parent_contacts` + `parent_students` tables
- `portals_students($pdo)` — `[{id, full_name, login_code}]` for multi-select
- `portals_generate_access_code('PR')` — generates `PR-NNNNNN`
- `portals_sync_links($pdo, 'parent_students', 'parent_id', $parentId, $studentIds)` — DELETE + re-INSERT

### Database Tables
**`parent_contacts`**
```
id           INT UNSIGNED AUTO_INCREMENT
full_name    VARCHAR(255) NOT NULL
email        VARCHAR(255) NULL
whatsapp     VARCHAR(100) NULL
status       'active'|'inactive' (DEFAULT 'active')
notes        TEXT NULL
access_code  VARCHAR(40) NULL
created_at   DATETIME
updated_at   DATETIME NULL
```

**`parent_students`** (junction)
```
id           INT UNSIGNED AUTO_INCREMENT
parent_id    INT UNSIGNED
student_id   INT UNSIGNED
status       'active' (DEFAULT)
created_at   DATETIME
UNIQUE (parent_id, student_id)
```

### API Contract

**GET `/api/owner/parents.php`**
```json
{
  "ok": true,
  "data": {
    "parents": [
      {
        "id": 3,
        "full_name": "Ahmed Al-Rashid",
        "email": "ahmed@example.com",
        "whatsapp": "971501234567",
        "status": "active",
        "notes": null,
        "access_code": "PR-482931",
        "student_count": 2,
        "students": "Sara Ahmed (SA-001), Youssef Ahmed (SA-002)",
        "created_at": "2026-05-15 09:22:00"
      }
    ]
  }
}
```

**GET `/api/owner/parents.php?action=students`**
```json
{
  "ok": true,
  "data": { "students": [{ "id": 7, "full_name": "Sara Ahmed", "login_code": "SA-001" }] }
}
```

**POST `/api/owner/parents.php` action=save**
```json
// Body:
{
  "action": "save",
  "full_name": "Ahmed Al-Rashid",
  "email": "ahmed@example.com",
  "whatsapp": "971501234567",
  "status": "active",
  "notes": "",
  "student_ids": [7, 12]
}
// Response:
{ "ok": true, "data": { "message": "Parent saved." } }
```
Note: `full_name` is required. `student_ids` is the complete list — portals_sync_links does DELETE + re-INSERT.

**POST `/api/owner/parents.php` action=delete**
```json
// Body: { "action": "delete", "id": 3 }
// Response: { "ok": true, "data": { "message": "Parent deactivated." } }
```
Soft delete: sets `status='inactive'`.

### Important Notes
- Source PHP only has CREATE (no edit by ID). Our REST API adds edit support via `save` with optional `id` field.
- Access code format: `PR-NNNNNN` (6 random digits, prefix `PR`).
- `portals_sync_links` takes the **full** `student_ids` array — partial updates not supported.
- `student_count` comes from COUNT join, `students` from GROUP_CONCAT join.

---

## 4. Access Links — `backend/api/owner/access-links.php`

### Purpose
Read-only view of portal login URLs and access codes for all Academies, Parents, and Media Buyers. Copy-to-clipboard UI.

### Lib Dependencies
```php
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
```
- `portals_ensure_schema($pdo)` — ensures tables exist before querying

### Data Sources
| Group | Table | Name field | Sub field | Login URL |
|-------|-------|------------|-----------|-----------|
| Academies | `academies` | `name` | `contact_name` | `{APP_BASE_URL}/academy/login.php` |
| Parents | `parent_contacts` | `full_name` | `whatsapp` | `{APP_BASE_URL}/parent/login.php` |
| Media Buyers | `media_buyers` | `full_name` | `email` | `{APP_BASE_URL}/media-buyer/login.php` |

`APP_BASE_URL` defaults to `https://mshabibanabil.com`.

### API Contract

**GET `/api/owner/access-links.php`**
```json
{
  "ok": true,
  "data": {
    "base_url": "https://mshabibanabil.com",
    "academies": [
      { "name": "Nour Academy", "sub": "Ahmed Ali", "access_code": "ACAD-123456" }
    ],
    "parents": [
      { "name": "Ahmed Al-Rashid", "sub": "971501234567", "access_code": "PR-482931" }
    ],
    "media_buyers": [
      { "name": "Sara Marketing", "sub": "sara@example.com", "access_code": "MB-993847" }
    ],
    "login_urls": {
      "academy": "https://mshabibanabil.com/academy/login.php",
      "parent": "https://mshabibanabil.com/parent/login.php",
      "media_buyer": "https://mshabibanabil.com/media-buyer/login.php"
    }
  }
}
```

### Important Notes
- No POST endpoint — purely read-only.
- `sub` field is `contact_name` for academies, `whatsapp` for parents, `email` for media buyers.
- The login URLs are static (base_url + role path) — frontend can hardcode or use `login_urls` from response.
- Copy button uses `navigator.clipboard` with textarea fallback.

---

## 5. Frontend Architecture Plan

### Features to Create

```
owner/features/
├── ai-settings/
│   ├── index.ts
│   ├── AISettingsPage.tsx
│   ├── types.ts
│   ├── api.ts
│   ├── animations.ts
│   ├── hooks/useAISettings.ts
│   ├── components/
│   │   ├── AIConnectionCard.tsx       ← API key status + connection badge + Test button
│   │   └── AISettingsForm.tsx         ← 6 fields (enabled, provider, model, limit, costs)
│   └── README.md
│
├── ai-logs/
│   ├── index.ts
│   ├── AILogsPage.tsx
│   ├── types.ts
│   ├── api.ts
│   ├── animations.ts
│   ├── hooks/useAILogs.ts
│   ├── components/
│   │   ├── AIHealthStrip.tsx           ← 4 KPIs: total/success/failed/cached
│   │   ├── AILogsFilter.tsx            ← feature select + status select
│   │   └── AILogRow.tsx               ← expandable row: prompt + response + error
│   └── README.md
│
├── parents/
│   ├── index.ts
│   ├── ParentsPage.tsx
│   ├── types.ts
│   ├── api.ts
│   ├── animations.ts
│   ├── hooks/useParents.ts
│   ├── components/
│   │   ├── ParentForm.tsx             ← name + email + whatsapp + status + notes + multi-select students
│   │   └── ParentsTable.tsx           ← animated cards, student count, access code display
│   └── README.md
│
└── access-links/
    ├── index.ts
    ├── AccessLinksPage.tsx
    ├── types.ts
    ├── api.ts
    ├── animations.ts
    ├── hooks/useAccessLinks.ts
    ├── components/
    │   └── AccessLinkGroup.tsx         ← table with copy-to-clipboard buttons per row
    └── README.md
```

### Routes to Add to `frontend/src/roles/owner/index.tsx`
```tsx
<Route path="ai-settings"  element={<AISettingsPage />} />
<Route path="ai-logs"      element={<AILogsPage />} />
<Route path="parents"      element={<ParentsPage />} />
<Route path="access-links" element={<AccessLinksPage />} />
```

---

## 6. TypeScript Types

### ai-settings/types.ts
```typescript
export interface AISettings {
  ai_enabled: '0' | '1'
  ai_provider: string
  ai_model: string
  ai_regenerate_limit_per_day: string
  ai_cost_per_1k_input: string
  ai_cost_per_1k_output: string
}

export interface AIConnectionStatus {
  status: 'configured' | 'not configured' | 'connection failed'
  message: string
}

export interface AISettingsData {
  settings: AISettings
  api_key_status: string
  connection: AIConnectionStatus
  connection_checked_at: string
}

export interface AISettingsResponse {
  ok: boolean
  data: AISettingsData
}

export interface AISettingsActionResponse {
  ok: boolean
  data: { message: string }
}

export interface AITestConnectionResponse {
  ok: boolean
  data: { status: string; message: string }
}
```

### ai-logs/types.ts
```typescript
export type AILogStatus = 'success' | 'failed' | 'cached'

export interface AILogEntry {
  id: number
  feature_key: string
  full_name: string | null
  student_id: number | null
  model: string
  status: AILogStatus
  cost_tokens_input: number
  cost_tokens_output: number
  estimated_cost_usd: string
  raw_prompt: string | null
  output_json: string | null
  error_message: string | null
  created_at: string
}

export interface AILogsHealth {
  total: number
  success: number
  failed: number
  cached: number
  api_key_configured: boolean
  api_key_masked: string
}

export interface AILogsData {
  logs: AILogEntry[]
  features: string[]
  health: AILogsHealth
}

export interface AILogsResponse {
  ok: boolean
  data: AILogsData
}
```

### parents/types.ts
```typescript
export interface Parent {
  id: number
  full_name: string
  email: string | null
  whatsapp: string | null
  status: 'active' | 'inactive'
  notes: string | null
  access_code: string | null
  student_count: number
  students: string | null
  created_at: string
}

export interface StudentOption {
  id: number
  full_name: string
  login_code: string
}

export interface ParentListResponse {
  ok: boolean
  data: { parents: Parent[] }
}

export interface StudentOptionsResponse {
  ok: boolean
  data: { students: StudentOption[] }
}

export interface ParentActionResponse {
  ok: boolean
  data: { message: string }
}
```

### access-links/types.ts
```typescript
export interface AccessLinkEntry {
  name: string
  sub: string | null
  access_code: string | null
}

export interface AccessLinksData {
  base_url: string
  academies: AccessLinkEntry[]
  parents: AccessLinkEntry[]
  media_buyers: AccessLinkEntry[]
  login_urls: {
    academy: string
    parent: string
    media_buyer: string
  }
}

export interface AccessLinksResponse {
  ok: boolean
  data: AccessLinksData
}
```

---

## 7. Component Details

### AIConnectionCard.tsx
- Displays: API key status string (masked) in info alert
- Badge: green=configured, yellow=not configured, red=connection failed
- "Test AI Connection" button → calls POST action=test_connection
- Shows `connection_checked_at` if set
- Loading state during test

### AISettingsForm.tsx
- Fields:
  - `ai_enabled`: select (Enabled / Disabled)
  - `ai_provider`: text input
  - `ai_model`: text input (shows current default `claude-haiku-4-5-20251001`)
  - `ai_regenerate_limit_per_day`: number input (min=1)
  - `ai_cost_per_1k_input`: text input
  - `ai_cost_per_1k_output`: text input
- Info note: "API key lives on the server — never paste it here"
- Save button → POST action=save

### AIHealthStrip.tsx
- 4 KPI cards: Total Requests, Success, Failed, Cached Hits
- Source: `data.health` from AI Logs response

### AILogsFilter.tsx
- Feature select (from `data.features` array — dynamic options)
- Status select: All, Success, Failed, Cached
- Controlled state in AILogsPage — triggers re-fetch on change

### AILogRow.tsx
- Collapsed: ID, time, feature_key, student name, status badge, tokens in/out, estimated cost
- Expandable panel (AnimatePresence): raw_prompt + output_json + error_message
- Monospace pre-wrapped for prompt/response display, max-height 200px with scroll
- Colors: success=accent, failed=danger, cached=warning

### ParentForm.tsx
- Fields: full_name (required), email, whatsapp, status (select: active/inactive), notes
- Multi-select student list (same pattern as AcademyForm.tsx — Set<number> state)
- Resets on successful save
- ~150 lines max

### ParentsTable.tsx
- Animated cards (stagger + rowVariant)
- Shows: name, email/whatsapp sub, access_code chip, student_count + students string
- Deactivate button → POST action=delete
- No edit in source — add a note that edit is not supported (create-only matches source)

### AccessLinkGroup.tsx
- Props: `title: string`, `entries: AccessLinkEntry[]`, `loginUrl: string`
- Table: Name col, Login URL col (readonly input + Copy button), Access Code col (readonly input + Copy button)
- Copy uses `navigator.clipboard.writeText()` with 1s "Copied!" feedback via local state
- Empty state: "No records yet."

### AccessLinksPage.tsx
- Three AccessLinkGroup instances: Academies, Parents, Media Buyers
- Uses `login_urls` from API response to pass correct URL to each group
- No mutations — read-only page

---

## 8. Key Notes for Build

1. **ai-governance lib already exists** at `backend/lib/lib/ai-governance.php` — use it directly.
2. **AI test connection**: `ai_governance_test_connection($pdo)` does the Anthropic call — add this as a new action in the new ai-settings.php file.
3. **Parent access code prefix**: `PR` → generates `PR-NNNNNN` via `portals_generate_access_code('PR')`.
4. **portals_sync_links signature**: `portals_sync_links($pdo, 'parent_students', 'parent_id', $parentId, $studentIds)` — always send the full list.
5. **access-links.php**: Queries THREE tables: `academies`, `parent_contacts`, `media_buyers`. All may be empty.
6. **AI Logs**: `raw_prompt` and `output_json` can be very large — backend returns them but truncate display in UI.
7. **AI model options**: Don't hardcode a dropdown — use a free-text input since models evolve.
8. **Copy button pattern**: Use `useState<string>` to track which access_code was just copied for the "Copied!" feedback. Reset after 1s with `setTimeout`.
9. **Log stale time**: AI logs change frequently — use `staleTime: 0` or `staleTime: 5_000` (not 15k).
10. **No PUT/PATCH for parents**: Source is create-only. Stick with create + deactivate (no edit drawer needed).

---

## 9. Backend File Stubs

### `backend/api/owner/ai-settings.php`
```
GET  → ai_governance_ensure + read 6 settings + api_key_status + ai_governance_status
POST action=save → csrf_validate + ai_governance_save_setting × 6
POST action=test_connection → csrf_validate + ai_governance_test_connection($pdo) → json_ok(result)
```

### `backend/api/owner/ai-logs.php`
```
GET ?feature=X&status=Y → ai_governance_ensure + query ai_requests LEFT JOIN students (LIMIT 100)
                         → features list (DISTINCT feature_key)
                         → health counts (SELECT COUNT(*) with WHERE status=...)
                         → api_key_configured check
```

### `backend/api/owner/parents.php`
```
GET              → portals_ensure_schema + list parents with student_count + GROUP_CONCAT students
GET ?action=students → portals_students($pdo)
POST action=save → csrf_validate + portals_generate_access_code('PR') + INSERT parent_contacts + portals_sync_links
POST action=delete → csrf_validate + UPDATE parent_contacts SET status='inactive'
```

### `backend/api/owner/access-links.php`
```
GET → portals_ensure_schema + SELECT from academies + parent_contacts + media_buyers
    → return {base_url, academies, parents, media_buyers, login_urls}
```

---

## 10. Summary

| Feature | Backend Endpoint | Frontend Page | Routes |
|---------|-----------------|---------------|--------|
| AI Settings | `owner/ai-settings.php` | `AISettingsPage` | `/owner/ai-settings` |
| AI Logs | `owner/ai-logs.php` | `AILogsPage` | `/owner/ai-logs` |
| Parents | `owner/parents.php` | `ParentsPage` | `/owner/parents` |
| Access Links | `owner/access-links.php` | `AccessLinksPage` | `/owner/access-links` |

**Total estimated files:** ~4 backend + ~30 frontend
