# REBUILD_PLAN.md — Habiba Nabil Arabic Academy
# Complete Phase-by-Phase Rebuild Plan

> Last Updated: May 2026
> Current Phase: 0 (Setup)
> Source: `D:\Habiba\web + app\New\`
> Destination: `D:\Habiba\web + app\Rebuild Habiba Website\`

---

## Overview

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation & Setup | 🔄 In Progress |
| 1 | Design System | ⏳ Pending |
| 2 | Core Shared Infrastructure | ⏳ Pending |
| 3 | Public Visitor | ⏳ Pending |
| 4 | Teacher Portal — Core | ⏳ Pending |
| 5 | Student Portal — Core | ⏳ Pending |
| 6 | Owner Portal | ⏳ Pending |
| 7 | Parent Portal | ⏳ Pending |
| 8 | Academy Partner Portal | ⏳ Pending |
| 9 | Media Buyer Portal | ⏳ Pending |
| 10 | Interactive Book | ⏳ Pending |
| 11 | AI Tools & Advanced Features | ⏳ Pending |
| 12 | QA, Performance, Launch | ⏳ Pending |

---

## PHASE 0 — Foundation & Setup

### 0.1 — Copy Backend from Core/
```
From: D:\Habiba\web + app\New\Core\
To:   D:\Habiba\web + app\Rebuild Habiba Website\backend\

Copy these folders exactly:
✅ api/          → backend/api/
✅ config/       → backend/config/
✅ lib/          → backend/lib/
✅ includes/     → backend/includes/
✅ interactive-books/ → backend/interactive-books/
✅ tools/        → backend/tools/
✅ database/     → database/existing/
✅ assets/fonts/ → frontend/public/assets/fonts/
✅ assets/audio/ → frontend/public/assets/audio/
✅ assets/img/   → frontend/public/assets/img/
✅ assets/css/   → backend/legacy-css/ (reference only)

DO NOT copy:
❌ uploads/      → stays on server, mount separately
❌ storage/      → stays on server
❌ .env          → create fresh .env from template
❌ error_log     → server artifact
❌ composer.lock → regenerate
```

### 0.2 — Create .env Files

**Backend `.env`** (copy from Core but reset sensitive values for dev):
```
DB_HOST=localhost
DB_NAME=u807160300_smarthomework
DB_USER=u807160300_habibanabil
DB_PASS=[real password from Core/.env]
ANTHROPIC_API_KEY=[from Core/.env]
TEACHER_PASSWORD=Habiba2026#Smart
VAPID_PUBLIC_KEY=[from Core/.env]
VAPID_PRIVATE_PEM=[from Core/.env]
VAPID_SUBJECT=mailto:info@mshabibanabil.com
APP_URL=https://mshabibanabil.com
APP_TIMEZONE=Asia/Dubai
ZIINA_API_KEY=[get from payment settings]
```

**Frontend `.env.local`**:
```
VITE_API_BASE_URL=https://mshabibanabil.com
VITE_APP_ENV=development
VITE_VAPID_PUBLIC_KEY=BM9k8Cr3_oVw3InM0n3cwNboASGLJMQjufMfebhwUp540A...
```

### 0.3 — Scaffold React App
```bash
# In: D:\Habiba\web + app\Rebuild Habiba Website\
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install framer-motion @tanstack/react-query zustand react-router-dom react-hook-form lucide-react
npm install -D tailwindcss @tailwindcss/vite typescript-eslint prettier playwright @playwright/test vite-bundle-analyzer
```

### 0.4 — MCP Installation
```bash
bash scripts/install-mcps.sh
```

### 0.5 — Create Folder Structure
```bash
bash scripts/create-structure.sh
```

**Phase 0 Exit Criteria**: `npm run dev` works, TypeScript compiles, backend files in place.

---

## PHASE 1 — Design System

### 1.1 — Copy & Convert Tokens
- Source: `Core/assets/css/app.css` (already documented in DESIGN_SYSTEM.md)
- Create: `frontend/src/design-system/tokens.css`
- Create: `frontend/src/design-system/animations.ts`
- Configure: `tailwind.config.ts` to use CSS variables

### 1.2 — Load Thmanyah Font
```css
/* fonts.css — adapted from Core/assets/css/fonts.css */
@font-face {
  font-family: 'ThmanyahSans';
  src: url('/assets/fonts/thmanyah/thmanyah-sans-regular.woff2') format('woff2');
  font-weight: 400;
}
/* ... all 12 weights */
```

### 1.3 — Base UI Components
Build these in `design-system/components/`:

| Component | Framer Motion | Priority |
|-----------|--------------|----------|
| Button (5 variants) | tap scale | 🔴 First |
| Input + Textarea | focus ring | 🔴 First |
| Card | hover y:-2 | 🔴 First |
| Badge | — | 🔴 First |
| Avatar | — | 🔴 First |
| Spinner / Skeleton | pulse | 🔴 First |
| Toast / Alert | slide + fade | 🔴 First |
| Modal | spring scale | 🟡 Second |
| Drawer | spring slide | 🟡 Second |
| EmptyState | fadeInUp | 🟡 Second |
| ErrorBoundary | — | 🟡 Second |

### 1.4 — Theme System
- `useTheme` hook (light/dark/system)
- Dark mode toggle component
- Persist in localStorage

**Phase 1 Exit Criteria**: Demo page showing all components in light + dark + RTL.

---

## PHASE 2 — Core Shared Infrastructure

### 2.1 — Auth System
```typescript
// Based on existing PHP session auth in Core/lib/helpers.php
// Session cookie: httpOnly, Secure, SameSite=Lax

interface AuthState {
  user: User | null
  role: 'student' | 'teacher' | 'owner' | 'parent' | 'academy' | 'media-buyer' | null
  isAuthenticated: boolean
}
```

Files to create:
- `core/auth/AuthContext.tsx`
- `core/auth/AuthGuard.tsx`
- `core/auth/useAuth.ts`
- `core/auth/api.ts`

### 2.2 — API Client
```typescript
// core/lib/apiClient.ts
// Base URL: VITE_API_BASE_URL
// Credentials: 'include' (session cookies)
// Response format: { ok: true, ...data } | { ok: false, error: string }
// (matches json_ok() / json_err() from Core/lib/helpers.php)
```

### 2.3 — Router
```typescript
// Role-based lazy loading:
const PublicApp      = lazy(() => import('@/roles/public'))
const StudentApp     = lazy(() => import('@/roles/student'))
const TeacherApp     = lazy(() => import('@/roles/teacher'))
// etc.
```

### 2.4 — Shared Notifications
Replaces: `notification-open.php` duplicated in 5 role folders

```
shared/notifications/
├── useNotifications.ts   ← polls every 30s
├── NotificationBell.tsx  ← bell icon + unread badge
├── NotificationList.tsx  ← dropdown
├── NotificationItem.tsx  ← single item
└── api.ts                ← GET /api/notifications, POST .../read
```

### 2.5 — Shared Help Center (Reader)
Replaces: 6 role-specific help pages

```
shared/help-center/
├── HelpCenter.tsx        ← role-aware page
├── HelpArticle.tsx       ← article reader
├── HelpSearch.tsx        ← search
└── api.ts                ← GET /api/help/articles?role=[role]
```

### 2.6 — Onboarding / Dashboard Tour
Replaces: `api/help/tour-progress.php` + duplicated JS

```
shared/onboarding/
├── OnboardingChecklist.tsx
├── DashboardTour.tsx
├── TourStep.tsx
└── useOnboarding.ts
```

**Phase 2 Exit Criteria**: Auth works, notifications appear, help center loads.

---

## PHASE 3 — Public Visitor

### Features (12 total):

| Feature | Key PHP Reference | Marketing Skills |
|---------|------------------|-----------------|
| Landing page | `lib/public-pages.php` | ✅ Yes |
| Pricing | `lib/payment-pages.php` | ✅ Yes |
| Checkout/Ziina | `lib/ziina.php`, `lib/checkout-flow.php` | ✅ Yes |
| Level test | `api/leveltest/` (4 endpoints) | ⬜ |
| Student intake form | `api/student/save-brief.php` | ✅ Yes |
| Testimonials | `lib/testimonials.php` | ✅ Yes |
| Articles | `lib/articles.php` | ⬜ |
| Videos | `lib/videos.php` | ⬜ |
| Help Center | `lib/help-center.php` | ⬜ |
| Payment status | `lib/payment-pages.php` | ✅ Yes |
| Schedule request | public contact form | ✅ Yes |
| Media buyer tracking | `lib/public-content.php` | ⬜ |

### Ziina Payment Flow (from `lib/ziina.php`):
```
1. Frontend: POST /api/public/checkout/initiate → { planSlug, name, email, phone }
2. PHP: calls ziina_create_payment_intent() → returns Ziina payment URL
3. Frontend: redirect to Ziina URL
4. Ziina: redirects to /payment-status.php?status=success|cancelled|failed&plan=X&ref=Y
5. Frontend: show appropriate confirmation screen
```

**Phase 3 Exit Criteria**: Public site live-ready. Ziina checkout completes. Level test submits.

---

## PHASE 4 — Teacher Portal

### Key PHP References:
- Dashboard: `api/teacher/` (90+ endpoints)
- AI Tools: `api/teacher/ai/` (15 endpoints including Claude API)
- Lesson planning: `api/teacher/lesson-plan-data.php` (was 2095 lines)
- Students: `api/teacher/add-student.php`, `api/teacher/student-*`

### Sprint breakdown:

**Sprint 4.1 — Dashboard & Students**
- [ ] Teacher dashboard (KPIs + today)
- [ ] Student list + search/filter
- [ ] Student profile + full details
- [ ] Add student form

**Sprint 4.2 — Learning Content**
- [ ] Homework creation (text/audio/video types)
- [ ] Homework correction + feedback
- [ ] Speaking scenarios creation
- [ ] Scenario review + feedback

**Sprint 4.3 — Assessment**
- [ ] Reviews/tests creation
- [ ] Review correction + PDF results (`api/teacher/send-result-email.php`)
- [ ] Level test review (`api/teacher/export-leveltest.php`)
- [ ] Lesson planning → broken into 9 components (see below)

**Sprint 4.4 — Resources**
- [ ] Materials library (`api/teacher/materials-save.php`, `materials-delete.php`)
- [ ] Schedule + bookings (`api/teacher/session-save.php`, `generate-month-sessions.php`)
- [ ] Lesson packages + credits

**Sprint 4.5 — Book & AI**
- [ ] Book submissions review
- [ ] AI tools panel (15 endpoints)
- [ ] Academy brief review

### Lesson Planning Breakdown (2095 lines → 9 components):
```
lesson-planning/
├── LessonPlanning.tsx       ← grid layout only, ~40 lines
├── components/
│   ├── LessonHeader.tsx     ← date, student, lesson type
│   ├── LessonGoals.tsx      ← learning objectives
│   ├── LessonActivities.tsx ← activities checklist
│   ├── LessonNotes.tsx      ← freeform teacher notes
│   ├── LessonHomework.tsx   ← link/create homework
│   ├── LessonMaterials.tsx  ← attached files
│   ├── LessonAIPanel.tsx    ← AI suggestions sidebar
│   └── LessonHistory.tsx    ← past lessons timeline
├── hooks/
│   ├── useLessonPlan.ts
│   └── useLessonAI.ts       ← calls api/teacher/ai/lesson.php
└── api.ts
```

---

## PHASE 5 — Student Portal

### Key PHP References:
- Dashboard: `student/brief.php`, hooks into `lib/learning-guidance.php`
- Flashcards: `lib/flashcards.php` (new lib found in Core)
- Homework: `api/review/submit.php`, `api/review/save.php`
- Book: `api/book-*.php` (7 endpoints), `lib/interactive-books.php`
- Weak words: `api/book-add-weak-word.php`, `api/teacher/save-weak-words.php`

### Student Dashboard Breakdown (1328 lines → 8 components):
```
dashboard/
├── StudentDashboard.tsx      ← grid only, ~40 lines
├── components/
│   ├── WelcomeCard.tsx       ← greeting + streak
│   ├── TodayActivity.tsx     ← today's tasks
│   ├── HomeworkWidget.tsx    ← pending count + preview
│   ├── LessonsWidget.tsx     ← next lesson countdown
│   ├── ProgressRing.tsx      ← circular progress
│   ├── FlashcardWidget.tsx   ← quick flashcard (lib/flashcards.php)
│   └── BookBanner.tsx        ← Interactive Book CTA
└── hooks/useStudentDashboard.ts
```

### Sprint breakdown:

**Sprint 5.1 — Core**
- [ ] Dashboard (8 components above)
- [ ] Login/logout
- [ ] Profile management
- [ ] Schedule/upcoming lessons

**Sprint 5.2 — Learning**
- [ ] Homework list + submit (with audio recording)
- [ ] Homework results + feedback
- [ ] Reviews/tests + results
- [ ] Scenarios + feedback

**Sprint 5.3 — Resources**
- [ ] Materials + downloads
- [ ] Session notes
- [ ] Progress charts
- [ ] Balance/credits

**Sprint 5.4 — Vocabulary**
- [ ] Flashcards (spaced repetition — `lib/flashcards.php`)
- [ ] Weak words
- [ ] Common mistakes

**Sprint 5.5 — Book & Social**
- [ ] Interactive Book access
- [ ] Book progress
- [ ] Testimonial submission
- [ ] Notifications

---

## PHASE 6 — Owner Portal

### Key PHP References:
- Analytics: `includes/analytics_tracker.php`, `includes/track_event.php`
- Payments: `lib/ziina.php`, `lib/checkout-flow.php`, `lib/payment-pages.php`
- Help CMS: `lib/help-center.php`
- Settings: `lib/settings.php` (new in Core)
- Book launch: `lib/book-sales.php`, `lib/book-notifications.php`
- AI settings: `lib/ai-governance.php`, `lib/ai-system.php`

### Features:
- [ ] Analytics dashboard (revenue, students, funnels)
- [ ] Payment overview + manual verification
- [ ] Articles/Videos management (`lib/articles.php`, `lib/videos.php`)
- [ ] Testimonials approval (`lib/testimonials.php`)
- [ ] Help Center CMS editor
- [ ] Settings center (`lib/settings.php`)
- [ ] Book launch control
- [ ] Academy management
- [ ] Media buyer management + agreements
- [ ] AI settings + logs

---

## PHASE 7 — Parent Portal

### Key PHP References:
- Child access: `parent/child/.htaccess` (special routing)
- Student data: read-only views of student endpoints
- Materials: `lib/materials-library.php` (read-only)
- Testimonials: `lib/testimonials.php`

All 21 features are read-only wrappers except contact + testimonial submit.

---

## PHASE 8 — Academy Partner Portal

### Key PHP References:
- Briefs: `lib/student-briefs.php` (new in Core), `api/student/save-brief.php`
- Communication: `lib/communications.php`

12 features — mostly brief submission and status tracking.

---

## PHASE 9 — Media Buyer Portal

### Key PHP References:
- Attribution tracking: `lib/public-content.php` (tracking links)
- Commission: relies on Owner payment verification
- Agreements: `api/teacher/contract-save.php`
- Events: `api/mobile/events.php` (attribution events)

13 features — campaign tracking, commission view.

---

## PHASE 10 — Interactive Arabic Book

### Key PHP References:
- **Book renderer**: `lib/interactive-book-pages.php` + `lib/interactive-books.php`
- **Lesson files**: `interactive-books/arabic-for-daily-life-beginner/lessons/` (15 files)
- **Audio**: `assets/audio/books/beginner/` (5 mp3 files)
- **API**: 7 endpoints in `api/book-*.php`
- **CSS**: `assets/css/interactive-book.css` + `assets/css/interactive-book-marketing.css`

### Components:
```
shared/interactive-book/
├── BookRenderer.tsx
├── components/
│   ├── BookLesson.tsx
│   ├── exercises/
│   │   ├── MultipleChoice.tsx
│   │   ├── FillInBlank.tsx
│   │   ├── ListeningActivity.tsx   ← uses assets/audio/books/
│   │   ├── SpeakingRecorder.tsx    ← browser MediaRecorder API
│   │   └── WritingSubmission.tsx
│   ├── BookProgress.tsx
│   └── BookNavigator.tsx
└── hooks/
    ├── useBookRenderer.ts
    ├── useAudioRecorder.ts         ← browser audio recording
    └── useBookProgress.ts
```

---

## PHASE 11 — AI Tools

### 15 AI endpoints (`api/teacher/ai/`):
```
analyze-student.php    → Student performance analysis
apply-article.php      → Apply article to lesson
article.php            → Generate article content
feedback-draft.php     → Draft homework feedback
homework.php           → Generate homework ideas
internal-note.php      → Create internal notes
lesson.php             → Lesson planning assistant
mistake-event.php      → Log mistake pattern
mistake-tags.php       → Tag and categorize mistakes
performance-summary.php → Weekly performance summary
review-priority.php    → Prioritize review items
scenario.php           → Generate speaking scenarios
sessions.php           → Session analysis
student-snapshot.php   → Quick student overview
suggestion-action.php  → Action from AI suggestion
writing-assist.php     → Writing exercise assistance
```

Also: `lib/ai-system.php`, `lib/ai-helpers.php`, `lib/ai-governance.php`

### Advanced:
- [ ] Mobile API (`api/mobile/` — 12 endpoints)
- [ ] Push notifications FCM (`api/push/` + `lib/push.php` + `lib/fcm.php`)
- [ ] PWA (`lib/pwa-head.php` → `manifest.json` + service worker)
- [ ] Cron jobs UI (`api/cron/` — 2 jobs)

---

## PHASE 12 — QA & Launch

### Checklist:
- [ ] All Playwright tests passing
- [ ] Mobile responsive 375px → 1440px
- [ ] RTL tested on all Arabic content
- [ ] Dark mode tested everywhere
- [ ] Performance budget met (see AI_RULES.md Rule 14)
- [ ] Security: CSRF on all mutations, no exposed keys
- [ ] `.htaccess` configured for React Router + PHP API routing
- [ ] Hostinger deployment (see `Core/HOSTINGER_DEPLOYMENT_GUIDE.md`)
- [ ] `Core/DEPLOYMENT_CHECKLIST.md` completed
- [ ] `Core/SECURITY_AUDIT_REPORT.md` issues resolved

---

## The Hybrid Rebuild Decision

**Frontend (React)**: Build fresh
- Use PHP files as SPEC — understand logic, don't copy HTML
- One session = one feature

**Backend (PHP API)**: Copy from Core + minor refactors
- Already has clean endpoints in `Core/api/`
- Helpers are well-structured (`json_ok`, `json_err`, `csrf_*`)
- Just ensure CORS headers work with React frontend

**Database**: Keep + migrate
- Real data in `u807160300_smarthomework`
- New tables go in `database/migrations/`

### Optimal Session Pattern:
```
1. "Read CLAUDE.md and Memory MCP"
2. "Here's the PHP reference: @backend/api/teacher/create-homework.php
    Extract the business rules and API contract"
3. "Now build HomeworkCreation.tsx following AI_RULES.md"
4. "Write the Playwright test for homework creation"
5. "Save this session's decisions to Memory MCP"
```

---

## Progress

```
Phase 0:  [░░░░░░░░░░]  0% — Foundation
Phase 1:  [░░░░░░░░░░]  0% — Design System
Phase 2:  [░░░░░░░░░░]  0% — Core Infrastructure
Phase 3:  [░░░░░░░░░░]  0% — Public Visitor
Phase 4:  [░░░░░░░░░░]  0% — Teacher Portal
Phase 5:  [░░░░░░░░░░]  0% — Student Portal
Phase 6:  [░░░░░░░░░░]  0% — Owner Portal
Phase 7:  [░░░░░░░░░░]  0% — Parent Portal
Phase 8:  [░░░░░░░░░░]  0% — Academy Partner
Phase 9:  [░░░░░░░░░░]  0% — Media Buyer
Phase 10: [░░░░░░░░░░]  0% — Interactive Book
Phase 11: [░░░░░░░░░░]  0% — AI Tools
Phase 12: [░░░░░░░░░░]  0% — QA & Launch
```
