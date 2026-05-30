# new-session.md — Claude Code Session Guide
# Habiba Nabil Arabic Academy

> Copy the relevant prompt at the start of EVERY Claude Code session.
> One feature per session = best quality output.

---

## Session Start Prompt (copy this EVERY time)

```
Read CLAUDE.md first, then AI_RULES.md, then check Memory MCP for this project.

Project: Habiba Nabil Arabic Academy
Source (read-only): D:\Habiba\web + app\New\
Destination (write here): D:\Habiba\web + app\Rebuild Habiba Website\

Current task: [DESCRIBE YOUR TASK]
Current phase: [Phase X from REBUILD_PLAN.md]
Role: [student | teacher | owner | public | parent | academy | media-buyer | shared]
Feature: [feature-name]

PHP reference files (spec only — don't convert, understand):
@backend/api/[relevant-file].php
@backend/lib/[relevant-lib].php

Active rules:
- Brand color: --accent: #0d4f4f (teal) — NEVER purple
- Max 200 lines per component
- Framer Motion on all interactive elements
- api.ts for all fetch calls
- RTL: CSS logical properties (margin-inline-start, not margin-left)
- Feature README.md required
- Playwright test required before "done"
```

---

## Session End Checklist

```
Before closing every session:

1. Save to Memory MCP:
   - Components created and their locations
   - API contracts finalized
   - Design decisions made
   - Patterns to reuse in other features
   - Any known issues or workarounds

2. Update files:
   - DECISIONS.md (if architectural choice was made)
   - REBUILD_PLAN.md (check off completed items)
   - Feature README.md (created/updated)

3. Quality checks:
   - npm run type-check  (zero TypeScript errors)
   - npm run lint        (zero ESLint warnings)

4. Tests:
   - Playwright test written for the feature
```

---

## Pattern 1 — Understanding PHP Logic

Use this BEFORE building any feature. Never convert directly.

```
I need to build [FeatureName] in React.
Here's the PHP that handles this logic:
@backend/api/teacher/create-homework.php
@backend/lib/helpers.php

Please:
1. Extract ALL business rules (validation, conditions, side effects)
2. List ALL API endpoints: method + path + request params + response shape
3. List ALL data structures displayed in the UI
4. Identify edge cases and special logic (error states, empty states)
5. Note any dependencies on other lib/ files

Return as structured analysis. Do NOT write React code yet.
```

---

## Pattern 2 — Building a Feature

Use AFTER Pattern 1 analysis is complete.

```
Now build [FeatureName] following CLAUDE.md and AI_RULES.md.

Location: frontend/src/roles/[role]/features/[feature]/

From the PHP analysis:
[paste key findings from Pattern 1]

Create in this exact order:
1. types.ts          ← TypeScript interfaces for all data
2. api.ts            ← all fetch calls (no fetching elsewhere)
3. animations.ts     ← Framer Motion variants for this feature
4. use[Feature].ts   ← TanStack Query hooks
5. components/       ← sub-components (each max 200 lines)
6. [FeatureName].tsx ← layout/composition only (max 200 lines)
7. index.tsx         ← re-exports
8. README.md         ← required docs

Brand color reminder: var(--accent) = #0d4f4f teal
Font: 'ThmanyahSans', 'Cairo', system-ui
```

---

## Pattern 3 — Breaking Down a Large PHP File

```
This PHP file is too large to understand at once:
@backend/[path/to/large-file.php]

It has [X] lines. Help me break it into React components.

Please:
1. Identify distinct UI sections (what does each visual block do?)
2. Identify data fetching (what APIs are called? when?)
3. Identify user interactions (forms, buttons, modals)
4. Propose component breakdown:
   [ComponentName].tsx — ~[lines] — [what it does]
   use[Hook].ts        — [what data it manages]
5. Identify what goes in api.ts vs hooks vs components

Format as a component tree I can implement one by one.
```

---

## Pattern 4 — Design System Component

```
Create a new base component for the design system.

Component: [ComponentName]
Location: frontend/src/design-system/components/[ComponentName].tsx

Requirements:
- Export the props interface (TypeScript)
- Use ONLY CSS variables for colors:
  Primary: var(--accent) = #0d4f4f teal
  Text: var(--ink), var(--muted)
  Background: var(--card), var(--bg)
  Border: var(--border)
- Dark mode: automatic via CSS variables (no extra code needed)
- Framer Motion animation variant: [specify — fadeInUp | cardVariant | modalVariant | etc.]
- RTL support: logical CSS properties
- Variants needed: [list all variants]

Reference the patterns in docs/DESIGN_SYSTEM.md.
```

---

## Pattern 5 — Playwright Test

```
Write a Playwright E2E test for [FeatureName].

File: tests/e2e/[role]/[feature-name].spec.ts

The feature does: [brief description]
Main user journey: [step by step]
API endpoints involved: [list]

Cover:
1. Happy path: [describe]
2. Error state: mock the API to return { ok: false, error: "..." }
3. Mobile: page.setViewportSize({ width: 375, height: 812 })
4. RTL check if applicable: page.evaluate(() => document.dir = 'rtl')

Use TypeScript. Import from @playwright/test.
```

---

## Pattern 6 — Shared Component for Multiple Roles

```
I need to build [FeatureName] that's used by multiple roles.

Roles that need it:
- [role1]: [how they use it — read/write/both]
- [role2]: [how they use it]

Owner role (writes data): [role]
Consumer roles (read only): [roles]

Location: frontend/src/shared/[feature-name]/

Build:
- The shared display component (used by all roles)
- The write/management component (owner role only, in roles/[owner]/features/)
- The shared hook that all roles can import
- types.ts that all can share

Follow the ownership rules in AI_RULES.md Rule 12.
```

---

## Pattern 7 — Adding a New PHP API Endpoint

When the existing PHP doesn't have what you need:

```
I need a new API endpoint for [purpose].

Existing similar endpoint for reference:
@backend/api/teacher/[similar-endpoint].php

New endpoint:
- Path: /api/[role]/[action].php
- Method: POST (or GET)
- Auth: requires [role] session
- Request: { [params] }
- Response: json_ok(['key' => value]) or json_err('message', code)
- Business logic: [describe]

Follow the patterns in the reference file.
Use: require_once __DIR__ . '/../../config/db.php'
Use: csrf_validate() for POST requests
Use: json_ok() / json_err() from lib/helpers.php
```

---

## Quick Reference: File Locations

```
New React component       → frontend/src/roles/[role]/features/[feature]/components/
New shared component      → frontend/src/shared/[feature]/
New design system piece   → frontend/src/design-system/components/
New shared hook           → frontend/src/core/hooks/
New API type              → frontend/src/core/types/ or feature/types.ts
New PHP endpoint          → backend/api/[role]/[action].php
New database migration    → database/migrations/[date]-[description].sql
New E2E test              → tests/e2e/[role]/[feature].spec.ts
```

---

## Memory MCP — What to Save Each Session

```
Entity name: "HabibaNabil_[FeatureName]"

Save these observations:
- "Location: frontend/src/roles/[role]/features/[feature]/"
- "Components: [list each file created]"
- "API endpoints used: [method path → response type]"
- "Pattern established: [reusable pattern for other features]"
- "Design decision: [any choice made and why]"
- "Known issue: [workaround or TODO with ticket]"
- "Dependencies: [what other features/hooks this uses]"

Also update entity "HabibaNabil_Progress":
- "Phase X: [feature] — DONE [date]"
```

---

## Impeccable Checklist (Before Every Commit)

```bash
npm run type-check     # zero TypeScript errors required
npm run lint           # zero ESLint errors required
npm run test:e2e       # all Playwright tests must pass
npm run build          # production build must succeed
```

```
Manual checks:
✅ No console.log in any .tsx or .ts file
✅ No hardcoded colors (#0d4f4f etc.) — only var(--accent) etc.
✅ No TypeScript 'any' types
✅ Every component under 200 lines
✅ Every feature has README.md
✅ Framer Motion on all cards, modals, page transitions
✅ Dark mode: toggle [data-theme="dark"] and check
✅ Mobile: 375px viewport — nothing breaks or overflows
✅ RTL: set dir="rtl" and check Arabic content areas
✅ Empty state: what shows when there's no data?
✅ Error state: what shows when API returns ok: false?
```

---

## Ziina Payment Testing

```
Test mode: payment_setting('ziina_test_mode') === '1'
Test card: use Ziina sandbox dashboard
AED amounts: stored as string "499", sent as fils = 49900

Flow to test:
1. Select plan → POST /api/public/checkout/initiate
2. Receive paymentUrl → redirect
3. Complete/cancel in Ziina sandbox
4. Return to /payment-status?status=success|cancelled|failed
5. Verify correct screen shown
```

---

## AI Tools Testing

```
15 AI endpoints at /api/teacher/ai/[tool].php
All use: ANTHROPIC_API_KEY from .env
Governance: lib/ai-governance.php (rate limits)

Test pattern:
1. Mock the AI endpoint in tests (don't call real API)
2. Return a realistic response structure
3. Verify UI handles: loading → result → error states
4. Check token usage display if applicable
```
