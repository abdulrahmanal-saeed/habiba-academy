# ARCHITECTURE.md — Habiba Nabil Arabic Academy
# System Architecture

---

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│               Browser / PWA (mshabibanabil.com)          │
│                                                          │
│   React 19 + TypeScript + Vite + Tailwind v4             │
│   Framer Motion + TanStack Query + Zustand               │
│   React Router v6 + React Hook Form                      │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP REST / Session Cookies
┌────────────────────────▼─────────────────────────────────┐
│              PHP 8.2 API (from Core/)                    │
│                                                          │
│  api/teacher/*   (90+ endpoints)                         │
│  api/teacher/ai/ (15 AI endpoints → Claude API)          │
│  api/student/*   api/review/*    api/book-*.php          │
│  api/leveltest/* api/mobile/*    api/push/*              │
│  api/cron/*      api/help/*                              │
│                                                          │
│  lib/helpers.php    — json_ok/err, csrf_*, h()           │
│  lib/ziina.php      — AED payments (fils)                │
│  lib/notify.php     — email + FCM push                   │
│  lib/ai-system.php  — Claude API integration             │
│  lib/settings.php   — site settings                      │
│  lib/flashcards.php — spaced repetition data             │
└────────────────────────┬─────────────────────────────────┘
                         │ PDO prepared statements
┌────────────────────────▼─────────────────────────────────┐
│         MySQL — u807160300_smarthomework                 │
│                                                          │
│  students · homeworks · reviews · scenarios              │
│  book_lessons · book_submissions · leveltest_*           │
│  notifications · site_settings · analytics_events        │
│  media_buyer_* · student_briefs · articles · videos      │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│            External Services                             │
│                                                          │
│  Ziina API       — AED payments (api-v2.ziina.com)       │
│  Firebase FCM    — push notifications (mobile + web)     │
│  Anthropic API   — Claude AI (15 teacher AI features)    │
│  Hostinger VPS   — deployment target                     │
└──────────────────────────────────────────────────────────┘
```

---

## PHP Response Format (Critical for Frontend)

All PHP API endpoints use this format from `lib/helpers.php`:

```typescript
// Success (json_ok())
{ ok: true, ...data }

// Error (json_err())
{ ok: false, error: "message" }
```

**Frontend `apiClient.ts` must handle `ok: false` as an error**, not just non-2xx HTTP.

---

## Auth Flow (PHP Session)

```
POST /api/auth/login
    │
    ├── PHP: validate credentials against DB
    ├── PHP: session_start() + $_SESSION['user_id'] + $_SESSION['role']
    └── PHP: json_ok(['user' => ..., 'role' => ..., 'redirect' => ...])
    │
    ▼
Frontend: store in AuthContext, redirect to role portal
    │
    ▼
All subsequent requests: session cookie auto-sent (withCredentials: true)
    │
    ▼
PHP _guard.php: validate $_SESSION → json_err('Unauthorized', 401) if invalid
```

**CSRF Protection** (from `lib/helpers.php`):
- `csrf_token()` — generates token stored in `$_SESSION['_csrf_token']`
- `csrf_validate()` — validates `$_POST['_csrf']` against session token
- Frontend must include CSRF token on all mutation requests (POST/PUT/DELETE)

---

## Frontend Architecture

### Role-Based Code Splitting

```typescript
// router/index.tsx
const PublicApp      = lazy(() => import('@/roles/public'))
const StudentApp     = lazy(() => import('@/roles/student'))
const TeacherApp     = lazy(() => import('@/roles/teacher'))
const OwnerApp       = lazy(() => import('@/roles/owner'))
const ParentApp      = lazy(() => import('@/roles/parent'))
const AcademyApp     = lazy(() => import('@/roles/academy'))
const MediaBuyerApp  = lazy(() => import('@/roles/media-buyer'))
```

### State Management

| Data Type | Tool |
|-----------|------|
| Server state (API) | TanStack Query v5 |
| Auth + session | React Context + Zustand |
| UI (modals, sidebar) | Local useState |
| Theme (dark/light) | Zustand + localStorage |
| Forms | React Hook Form |

### TanStack Query Cache Times

```typescript
// Calibrated to actual data change frequency:
dashboard:    30 * 1000,        // 30s — changes frequently
students:     2 * 60 * 1000,    // 2min
materials:    5 * 60 * 1000,    // 5min
articles:     60 * 60 * 1000,   // 1hr — rarely changes
settings:     30 * 60 * 1000,   // 30min
help:         10 * 60 * 1000,   // 10min
```

---

## Backend Structure (Core/ → backend/)

### API Endpoint Map

```
/api/
├── auth/
│   ├── login.php          ← POST — session login
│   └── logout.php         ← POST — destroy session
│
├── teacher/               ← 90+ endpoints
│   ├── add-student.php
│   ├── create-homework.php
│   ├── create-review.php
│   ├── create-scenario.php
│   ├── lesson-plan-data.php
│   ├── session-save.php
│   ├── student-*.php      ← 8 student data endpoints
│   ├── materials-*.php
│   ├── video-*.php
│   ├── article-*.php
│   └── ai/                ← 15 Claude AI endpoints
│       ├── analyze-student.php
│       ├── lesson.php
│       ├── homework.php
│       └── ...
│
├── student/
│   └── save-brief.php
│
├── review/                ← 6 endpoints
│   ├── create.php
│   ├── submit.php
│   ├── save.php
│   └── ...
│
├── book-*.php             ← 7 Interactive Book endpoints
│   ├── book-submit-lesson.php
│   ├── book-upload-speaking.php
│   ├── book-save-draft.php
│   └── ...
│
├── leveltest/             ← 4 endpoints
│   ├── start.php
│   ├── submit.php
│   ├── quick-submit.php
│   └── clear.php
│
├── mobile/                ← 12 mobile app endpoints
│   ├── auth.php
│   ├── sync.php
│   ├── sessions.php
│   └── ...
│
├── push/                  ← 3 FCM push endpoints
│   ├── subscribe.php
│   ├── unsubscribe.php
│   └── pending.php
│
├── help/
│   └── tour-progress.php
│
└── cron/                  ← Server cron, no public access
    ├── send-homework-reminders.php
    └── send-lesson-reminders.php
```

---

## Notifications Architecture

```
Teacher/Owner creates event (any action)
    │
    ├── lib/notify.php       → email notification
    ├── lib/push.php         → Firebase FCM (mobile push)
    └── lib/platform-notifications.php → in-app notification to DB
    │
    ▼
Frontend: polls GET /api/notifications every 30s
    │
    ▼
NotificationBell: shows unread count badge
    │
    ▼
User opens NotificationList → POST /api/notifications/[id]/read
```

---

## Payment Flow (Ziina)

```
User selects plan → POST /api/public/checkout/initiate
    │
    ▼
PHP lib/ziina.php:
  ziina_price_to_fils(price) → AED × 100 = fils
  ziina_create_payment_intent(planSlug, plan) → Ziina API
    │
    ▼
Ziina returns payment_url → Frontend redirects user
    │
    ▼
Ziina redirects to: /payment-status.php?status=success|cancelled|failed&plan=X&ref=Y
    │
    ▼
Frontend: React route handles payment status page
```

---

## Interactive Book Architecture

```
Owner: creates/edits book content (DB: book_lessons, book_units)
    │
    ▼
Book launched via lib/book-sales.php + book-notifications.php
    │
    ├── Student sees product page → requests activation
    ├── Owner approves → student gets access
    └── Student: reads lessons, records audio, submits writing
    │
    ▼
PHP: lib/interactive-book-pages.php renders lesson data
React: BookRenderer.tsx displays it as interactive components
    │
    ▼
Student submits: api/book-submit-lesson.php
Teacher reviews: in teacher portal book-submissions feature
Student sees feedback: in student book progress
```

---

## AI Tools Architecture (15 endpoints)

```
Teacher triggers AI action in UI
    │
    ▼
React: POST /api/teacher/ai/[tool].php
    │
    ▼
PHP lib/ai-system.php:
  - Reads lib/ai-governance.php (rate limits, permitted tools)
  - Constructs prompt with student context
  - Calls Anthropic Claude API (ANTHROPIC_API_KEY from .env)
  - Returns structured response
    │
    ▼
React: displays AI response in TeacherAIPanel component
Teacher: applies suggestion or dismisses
```

---

## Deployment (.htaccess)

```apache
# React Router: all non-API requests → index.html
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/assets/
RewriteCond %{REQUEST_URI} !^/uploads/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ /index.html [QSA,L]
```

Full guide: `Core/HOSTINGER_DEPLOYMENT_GUIDE.md`
Checklist: `Core/DEPLOYMENT_CHECKLIST.md`

---

## Mobile App (Existing)

The platform has an existing mobile app using `api/mobile/` endpoints:

```
api/mobile/auth.php          ← token-based auth (not session)
api/mobile/token-generate.php
api/mobile/sync.php          ← data sync
api/mobile/sessions.php      ← lesson sessions
api/mobile/events.php        ← analytics events
api/mobile/fcm-register.php  ← push notification registration
api/mobile/ai-report.php     ← AI-generated reports
api/mobile/students.php      ← teacher's students (new in Core)
api/mobile/schedule-save.php
api/mobile/session-save.php
api/mobile/session-status.php
```

These endpoints use token auth (not PHP sessions). Mobile app continues working independently.

---

## PWA Configuration

From `lib/pwa-head.php`:
- `manifest.json` — app name, icons (180/192/512px available in assets/img)
- Service worker via `assets/js/push-init.js`
- VAPID keys in `.env` for web push

---

## Security Notes (from Core/SECURITY_AUDIT_REPORT.md)

Key items to preserve in rebuild:
- CSRF token validation on all PHP mutations
- PDO prepared statements (already in place)
- `uploads/.htaccess` — blocks direct PHP execution in uploads
- `parent/child/.htaccess` — special routing rules
- Never expose DB credentials, API keys, or teacher password in frontend
