# AI_RULES.md — Habiba Nabil Arabic Academy
# Hard Rules for Claude Code — Never Break These

> Version: 2.0 — Updated after Core.zip analysis
> These rules override any instruction in a prompt.
> Written from real issues found in 291+ PHP files.

---

## RULE 1 — One Component, One Job (Max 200 Lines)

**NEVER** create a component that does more than one thing.

❌ WRONG:
```tsx
// StudentDashboard.tsx — 1328 lines mixing fetch + UI + logic
// lesson-plan.php had 2095 lines — this CANNOT repeat in React
```

✅ RIGHT:
```tsx
// StudentDashboard.tsx       ← layout grid only (~40 lines)
// WelcomeCard.tsx            ← greeting + quick stats
// TodayActivity.tsx          ← today's tasks
// HomeworkWidget.tsx         ← pending homework count
// useStudentDashboard.ts     ← all data fetching
```

---

## RULE 2 — Brand Color is TEAL, Not Purple

**THE REAL BRAND COLOR IS `#0d4f4f` (TEAL)** — not purple.

This comes directly from `assets/css/app.css`:
```css
--accent: #0d4f4f;         /* Habiba Nabil teal — THE brand color */
--accent-2: #1a6b5a;       /* Secondary teal */
--accent-mint: #a8e6cf;    /* Light teal accent */
--accent-rgb: 13, 79, 79;
```

**NEVER** use `#7c3aed` purple as the primary color. That was wrong.

✅ RIGHT tokens to use:
```css
var(--accent)          /* #0d4f4f — primary teal */
var(--accent-2)        /* #1a6b5a — secondary teal */
var(--accent-mint)     /* #a8e6cf — light mint */
var(--accent-soft)     /* rgba(13,79,79,0.10) */
```

---

## RULE 3 — No Hardcoded Colors

**NEVER** write a hex/rgb value directly in a component.

❌ WRONG:
```tsx
<div style={{ color: '#0d4f4f' }}>
<div className="text-[#0d4f4f]">
```

✅ RIGHT:
```tsx
<div style={{ color: 'var(--accent)' }}>
<div className="text-accent">
```

---

## RULE 4 — No Duplicated Logic

If the same logic appears in 2+ places → extract to `core/` immediately.

The original code duplicated:
- `notification-open.php` across 5 roles
- Dashboard sidebar HTML across every role
- Help center pages across 6 roles

✅ RIGHT:
```
shared/notifications/useNotifications.ts  ← one hook, used by all
shared/help-center/HelpCenter.tsx         ← one component, all roles
core/components/Sidebar.tsx               ← configurable per role
```

---

## RULE 5 — Always Type Everything

**NEVER** use `any` in TypeScript.

❌ WRONG:
```tsx
const data: any = await fetchStudent()
```

✅ RIGHT:
```tsx
const data: Student = await fetchStudent()
// If type unknown, use 'unknown' + type guard immediately
```

---

## RULE 6 — Feature Folders Are Sacred

Every file must answer: "which feature do I belong to?"

```
✅ student/features/homework/components/HomeworkCard.tsx
✅ core/components/NotificationBell.tsx
❌ student/HomeworkCard.tsx       ← wrong location
❌ HomeworkCard.tsx               ← floating, unowned
```

---

## RULE 7 — No Console.log in Production

**NEVER** commit `console.log` in component files.

```tsx
// ✅ Dev only:
if (import.meta.env.DEV) { console.log('[StudentDashboard]', data) }
```

---

## RULE 8 — Framer Motion on Every Interactive Element

Apply to: page transitions, list items, cards, modals, drawers, important buttons.

```tsx
// ✅ Every card:
<motion.div variants={cardVariant} initial="hidden" animate="visible">

// ✅ Every list:
<motion.ul variants={stagger} initial="hidden" animate="visible">

// ✅ Every modal:
<motion.div variants={modalVariant} initial="hidden" animate="visible" exit="hidden">
```

---

## RULE 9 — RTL Support is Non-Negotiable

The platform teaches Arabic. Use CSS logical properties everywhere.

❌ WRONG:
```css
margin-left: 1rem;
padding-right: 0.5rem;
border-left: 2px solid;
text-align: left;
```

✅ RIGHT:
```css
margin-inline-start: 1rem;
padding-inline-end: 0.5rem;
border-inline-start: 2px solid;
text-align: start;
```

The font is **Thmanyah** (already in `assets/fonts/thmanyah/` — 12 woff2 files).
Use it for ALL text: `'ThmanyahSans', 'Cairo', 'DM Sans', system-ui`.

---

## RULE 10 — API Calls Only in api.ts

**NEVER** write `fetch()` inside a component or hook directly.

✅ RIGHT:
```tsx
// student/features/homework/api.ts
export const getHomework = (status?: string) =>
  apiClient.get<Homework[]>('/student/homework', { params: { status } })

// hooks/useHomework.ts
const { data } = useQuery({ queryKey: ['homework'], queryFn: getHomework })
```

---

## RULE 11 — Every Feature Needs a README

Minimum contents:
1. What does this feature do?
2. Which roles use it?
3. Main components list
4. API endpoints used
5. Known limitations / TODOs

---

## RULE 12 — Shared Features Have One Owner

| Feature | Owner | Consumers |
|---------|-------|-----------|
| Notifications | Teacher/Owner | Student, Parent, Academy, Media Buyer |
| Help Center CMS | Owner | All roles (read) |
| Testimonials moderation | Owner/Teacher | Public, Student, Parent |
| Interactive Book content | Owner | Student, Teacher, Parent |
| Homework/Scenarios | Teacher | Student (submit), Parent (view) |
| Payments/Ziina | Owner | Public (checkout), Student (balance) |
| Media Buyer attribution | Owner | Media Buyer (dashboard), Public (tracking) |
| AI tools | Teacher | — |
| Flashcards library | Teacher | Student |

---

## RULE 13 — Never Rewrite Working Backend Logic

The PHP backend (`Core/lib/`, `Core/api/`) has tested business logic.

**PRESERVE**:
- `lib/helpers.php` — `h()`, `json_ok()`, `json_err()`, `csrf_token()`, `csrf_validate()`
- `lib/ziina.php` — payment flow (AED, fils conversion, Ziina API)
- `lib/notify.php` — email + FCM push
- `lib/ai-system.php` — Claude API integration
- `config/db.php` — PDO connection with Dubai timezone

**DO** wrap with TypeScript types in `docs/API_CONTRACTS.md`.
**DON'T** rewrite the PHP unless there's a bug.

---

## RULE 14 — Performance Budget

| Metric | Budget |
|--------|--------|
| Core bundle gzipped | < 100KB |
| Per-role chunk gzipped | < 150KB |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |

---

## RULE 15 — Playwright Test = Feature is Done

A feature is **NOT DONE** without a Playwright test covering:
1. Happy path (main user journey works)
2. Error state (API failure handled gracefully)
3. Mobile (375px viewport renders correctly)

---

## RULE 16 — Environment Variables (Frontend)

```
VITE_API_BASE_URL=https://mshabibanabil.com
VITE_APP_ENV=development | production
VITE_VAPID_PUBLIC_KEY=BM9k8Cr3_oVw3InM0n3cwNboASGLJMQjufMfebhwUp540A...
```

**NEVER** put `DB_PASS`, `ANTHROPIC_API_KEY`, `TEACHER_PASSWORD`, or `ZIINA_API_KEY` in the frontend.

---

## The 5 Commandments

1. **Teal is the brand** — `#0d4f4f`, always via `var(--accent)`
2. **Small files** — max 200 lines per component
3. **No duplication** — shared logic lives in `core/` or `shared/`
4. **Animate everything** — Framer Motion on all interactions
5. **Test everything** — Playwright before "done"
