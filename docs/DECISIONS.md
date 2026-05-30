# DECISIONS.md — Architecture Decision Records
# Habiba Nabil Arabic Academy

> Every major technical decision recorded with reasoning.
> Format: Date · Decision · Why · Alternatives · Consequences

---

## ADR-001 — React 19 + TypeScript over PHP Templates
**Date**: May 2026 | **Status**: Accepted

**Decision**: Rebuild frontend in React 19 + TypeScript. PHP stays as API only.

**Why** (from real code analysis):
- `lesson-plan.php` = 2095 lines mixing HTML + PHP + inline CSS + JS
- `student/home.php` = 1328 lines, duplicated in 5 different role folders
- No component reuse — every sidebar was hand-coded per role
- Zero TypeScript = runtime bugs caught only in production

**Alternatives**: Full PHP rewrite (same problem), Next.js (overkill for Hostinger VPS), Vue 3 (valid but smaller AI tooling)

**Consequences**: Need API contracts. PHP becomes pure REST. Better long-term.

---

## ADR-002 — Teal #0d4f4f as THE Brand Color (Not Purple)
**Date**: May 2026 | **Status**: Accepted

**Decision**: `--accent: #0d4f4f` is the one primary brand color. No purple.

**Why** (from `Core/assets/css/app.css`):
```css
--accent: #0d4f4f;      /* Habiba Nabil teal palette */
--accent-2: #1a6b5a;
--accent-mint: #a8e6cf;
--accent-rgb: 13, 79, 79;
```
Earlier documentation incorrectly used `#7c3aed` purple. Corrected after reading real source.

**Consequences**: All design work uses teal. Dark mode teal shifts to `#2ab5a0` for contrast.

---

## ADR-003 — PHP Session Auth (Not JWT)
**Date**: May 2026 | **Status**: Accepted

**Decision**: Keep existing PHP session auth from `lib/helpers.php`.

**Why**:
- Already battle-tested in production
- `csrf_token()` + `csrf_validate()` already implemented correctly
- Sessions are fine for web app (not a public third-party API)
- JWT adds complexity with no benefit here

**Key functions to preserve**:
```php
start_session()      // safe session start
csrf_token()         // generate/get CSRF token
csrf_validate()      // validate POST CSRF token
json_ok($data)       // { ok: true, ...data }
json_err($msg, $code) // { ok: false, error: "msg" }
h($value)            // htmlspecialchars wrapper
```

---

## ADR-004 — TanStack Query for Server State
**Date**: May 2026 | **Status**: Accepted

**Decision**: TanStack Query (React Query v5) for all API data.

**Cache times** (calibrated to data change frequency):
```
dashboard:  30s     (changes on every action)
students:   2min    (moderately changing)
materials:  5min
articles:   1hr     (rarely changes)
settings:   30min
help:       10min
```

---

## ADR-005 — Hybrid Rebuild Strategy
**Date**: May 2026 | **Status**: Accepted

**Decision**: Frontend = fresh React. Backend = copy Core/ + refactor. DB = keep + migrations.

**Source of truth**:
- PHP files = SPEC for business rules (read, don't convert)
- `Core/api/` = working endpoints (copy to `backend/api/`)
- `Core/lib/` = tested business logic (copy to `backend/lib/`)
- DB `u807160300_smarthomework` = real data (keep, add via migrations)

**How to use existing code with Claude**:
```
✅ "Extract the business rules from this PHP file: @backend/api/teacher/create-homework.php"
✅ "What API endpoints does this feature use? @backend/api/teacher/lesson-plan-data.php"
❌ "Convert this PHP to React" — produces spaghetti React
❌ "Here's all 291 files, rewrite everything" — context overflow
```

---

## ADR-006 — Tailwind CSS v4 over Bootstrap 5
**Date**: May 2026 | **Status**: Accepted

**Decision**: Replace Bootstrap 5.3.3 (from original) with Tailwind v4.

**Why**:
- Original had Bootstrap classes + custom CSS + inline styles all mixed
- Bootstrap's opinionated components blocked custom teal design
- Tailwind + CSS variables = design system consistency

**CSS Variables**: Keep the existing `--accent`, `--ink`, `--card`, etc. from `app.css`. They work perfectly with Tailwind's `bg-[var(--accent)]` syntax.

---

## ADR-007 — Framer Motion for All Animations
**Date**: May 2026 | **Status**: Accepted

**Decision**: Framer Motion exclusively. No CSS `@keyframes` for interactive animations.

**Animation budget**:
- Page transitions: < 300ms
- Card reveals: < 400ms  
- Modal open: < 200ms (spring)
- Hover effects: immediate (whileHover, no delay)
- Stagger lists: 80ms between items

**Applied to**: every page transition, every card, every modal/drawer, every list, loading states.

---

## ADR-008 — Thmanyah Font as Primary UI Font
**Date**: May 2026 | **Status**: Accepted

**Decision**: Use Thmanyah (12 woff2 files already in `Core/assets/fonts/`) as the primary font for ALL text — both Arabic and English UI.

**Why**: Already licensed and loaded in the original. Distinctive brand feel. Covers all needed weights (Light through Black). Cairo as fallback (already in Google Fonts import).

**Font stack**:
```css
font-family: 'ThmanyahSans', 'Cairo', 'DM Sans', system-ui, sans-serif;
```

---

## ADR-009 — Zustand for Client State
**Date**: May 2026 | **Status**: Accepted

**Decision**: Zustand for auth state, theme, and UI state.

**Stores**:
- `authStore` — user, role, isAuthenticated
- `themeStore` — dark/light/system, persisted to localStorage
- `uiStore` — sidebar open, active tour step, active modal

---

## ADR-010 — Playwright for E2E (Not Cypress)
**Date**: May 2026 | **Status**: Accepted

**Decision**: Playwright for all E2E testing.

**Why**: Faster than Cypress, real mobile emulation (375px), multi-browser, first-class TypeScript, excellent trace viewer.

**Test requirements per feature**:
1. Happy path (main flow works)
2. Error state (API failure handled)
3. Mobile viewport (375px width)

---

## ADR-011 — Keep Ziina for Payments (AED)
**Date**: May 2026 | **Status**: Accepted

**Decision**: Keep existing Ziina payment integration from `lib/ziina.php`.

**Why**: Already working in production. AED currency (fils = AED × 100). Test mode available. Redirect flow is clean.

**Frontend responsibility**: Only initiate payment + show result page. All Ziina API calls stay in PHP backend.

---

## ADR-012 — One Feature = One Folder (Max 200 Lines)
**Date**: May 2026 | **Status**: Accepted

**Decision**: Every feature in its own folder. Every component max 200 lines. Mandatory README.

**Justified by** real code found:
- `lesson-plan.php`: 2095 lines → 9 React components
- `student/home.php`: 1328 lines → 8 React components
- `api/teacher/ai/`: 15 separate endpoints → 15 separate tool components

---

## ADR-013 — `ok: true/false` Response Contract
**Date**: May 2026 | **Status**: Accepted

**Decision**: Frontend `apiClient` checks `response.data.ok`, not just HTTP status.

**Why**: PHP `json_ok()` returns HTTP 200 with `{ ok: true }`. PHP `json_err()` returns HTTP 400/401/403 with `{ ok: false, error: "msg" }`. Both patterns are used — must handle both.

```typescript
// apiClient interceptor:
if (response.data.ok === false) {
  throw new ApiError(response.data.error, response.status)
}
```

---

## Template for New Decisions

```markdown
## ADR-XXX — [Title]
**Date**: [Date] | **Status**: Accepted | Proposed | Superseded by ADR-YYY

**Decision**: [One clear sentence]

**Why**: [Bullet points — reference real code when possible]

**Alternatives**: [What else was evaluated]

**Consequences**: [What changes]
```
