# CLAUDE.md — Habiba Nabil Arabic Academy
# Claude Code Master Instructions

> Read this BEFORE touching any file. No exceptions.
> Source of truth for every decision in this project.

---

## 0. Project Identity

**Product**: Habiba Nabil Arabic Academy (`mshabibanabil.com`)
**DB Name**: `u807160300_smarthomework`
**Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion
**Backend**: PHP 8.2 REST API (existing — preserved, not rewritten)
**Database**: MySQL (existing schema — extended via migrations only)
**Deployment**: Hostinger VPS
**Timezone**: Asia/Dubai
**Currency**: AED (fils = AED × 100, via Ziina)

---

## 1. Source Paths (Windows)

```
Original site (read-only reference):
  D:\Habiba\web + app\New\

Rebuild destination (all new code goes here):
  D:\Habiba\web + app\Rebuild Habiba Website\
```

**Never edit files in `New\`. Only read them as reference/spec.**

---

## 2. Mandatory Reading Order

Before working on ANY task, read in order:

1. `CLAUDE.md` ← you are here
2. `AI_RULES.md` ← hard rules, never break
3. `docs/ARCHITECTURE.md` ← system design
4. `docs/DESIGN_SYSTEM.md` ← real tokens from app.css
5. `docs/API_CONTRACTS.md` ← frontend ↔ backend
6. The relevant `roles/[role]/README.md`

---

## 3. Folder Structure (Canonical)

```
Rebuild Habiba Website/
│
├── CLAUDE.md                        ← Master instructions (this file)
├── AI_RULES.md                      ← Hard rules for Claude Code
├── REBUILD_PLAN.md                  ← Phase-by-phase plan
├── README.md                        ← Project overview
│
├── docs/
│   ├── ARCHITECTURE.md              ← System architecture
│   ├── DESIGN_SYSTEM.md             ← Design tokens (from real app.css)
│   ├── API_CONTRACTS.md             ← TypeScript API interfaces
│   ├── DATABASE_SCHEMA.md           ← DB tables reference
│   └── DECISIONS.md                 ← Architecture Decision Records
│
├── scripts/
│   ├── install-mcps.sh              ← MCP installation
│   ├── create-structure.sh          ← Folder scaffolding
│   └── new-session.md               ← Session starter prompts
│
├── frontend/                        ← React 19 app (NEW)
│   ├── src/
│   │   ├── core/                    ← Shared across ALL roles
│   │   │   ├── auth/                ← Auth context, guards, session
│   │   │   ├── components/          ← Shared UI components
│   │   │   ├── hooks/               ← Shared hooks
│   │   │   ├── lib/                 ← apiClient, helpers, utils
│   │   │   ├── stores/              ← Zustand global state
│   │   │   └── types/               ← Global TypeScript types
│   │   │
│   │   ├── design-system/           ← Design system
│   │   │   ├── tokens.css           ← CSS custom properties (from app.css)
│   │   │   ├── components/          ← Base UI primitives
│   │   │   ├── animations/          ← Framer Motion variants
│   │   │   └── icons/               ← Custom SVG icons
│   │   │
│   │   ├── roles/
│   │   │   ├── public/              ← Public Visitor
│   │   │   │   ├── features/
│   │   │   │   │   ├── landing/
│   │   │   │   │   ├── level-test/
│   │   │   │   │   ├── checkout/
│   │   │   │   │   ├── articles/
│   │   │   │   │   ├── videos/
│   │   │   │   │   ├── testimonials/
│   │   │   │   │   ├── contact/
│   │   │   │   │   └── help/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── student/
│   │   │   │   ├── features/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── homework/
│   │   │   │   │   ├── reviews/
│   │   │   │   │   ├── scenarios/
│   │   │   │   │   ├── materials/
│   │   │   │   │   ├── progress/
│   │   │   │   │   ├── flashcards/
│   │   │   │   │   ├── weak-words/
│   │   │   │   │   ├── book/
│   │   │   │   │   ├── schedule/
│   │   │   │   │   ├── balance/
│   │   │   │   │   ├── profile/
│   │   │   │   │   └── notifications/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── teacher/
│   │   │   │   ├── features/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── students/
│   │   │   │   │   ├── lesson-planning/
│   │   │   │   │   ├── homework/
│   │   │   │   │   ├── reviews/
│   │   │   │   │   ├── scenarios/
│   │   │   │   │   ├── materials/
│   │   │   │   │   ├── level-test/
│   │   │   │   │   ├── book-submissions/
│   │   │   │   │   ├── ai-tools/
│   │   │   │   │   ├── schedule/
│   │   │   │   │   └── packages/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── owner/
│   │   │   │   ├── features/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── payments/
│   │   │   │   │   ├── book-launch/
│   │   │   │   │   ├── help-cms/
│   │   │   │   │   ├── settings/
│   │   │   │   │   ├── media-buyers/
│   │   │   │   │   ├── articles/
│   │   │   │   │   ├── videos/
│   │   │   │   │   ├── testimonials/
│   │   │   │   │   ├── academies/
│   │   │   │   │   ├── ai-settings/
│   │   │   │   │   └── audit-log/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── parent/
│   │   │   │   ├── features/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── children/
│   │   │   │   │   ├── child-homework/
│   │   │   │   │   ├── child-reviews/
│   │   │   │   │   ├── child-progress/
│   │   │   │   │   ├── child-materials/
│   │   │   │   │   ├── child-book/
│   │   │   │   │   ├── notifications/
│   │   │   │   │   └── contact/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── academy/
│   │   │   │   ├── features/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── briefs/
│   │   │   │   │   ├── students/
│   │   │   │   │   └── notifications/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   └── media-buyer/
│   │   │       ├── features/
│   │   │       │   ├── dashboard/
│   │   │       │   ├── tracking/
│   │   │       │   ├── campaigns/
│   │   │       │   ├── commissions/
│   │   │       │   └── notifications/
│   │   │       └── README.md
│   │   │
│   │   ├── shared/                  ← Multi-role shared features
│   │   │   ├── notifications/
│   │   │   ├── help-center/
│   │   │   ├── onboarding/
│   │   │   ├── testimonials/
│   │   │   └── interactive-book/
│   │   │
│   │   ├── router/
│   │   └── main.tsx
│   │
│   ├── public/
│   │   └── assets/                  ← Copied from Core/assets/
│   │       ├── fonts/thmanyah/      ← 12 Thmanyah woff2 files
│   │       ├── audio/               ← Book + leveltest audio
│   │       └── img/                 ← logo.svg, favicon, habiba.jpg
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                         ← PHP 8.2 (refactored from Core/)
│   ├── api/                         ← REST endpoints (from Core/api/)
│   │   ├── teacher/                 ← 90+ teacher endpoints
│   │   │   └── ai/                  ← 15 AI endpoints
│   │   ├── student/
│   │   ├── review/
│   │   ├── mobile/                  ← Mobile app support
│   │   ├── push/                    ← FCM push notifications
│   │   ├── help/
│   │   ├── leveltest/
│   │   └── cron/                    ← Scheduled jobs
│   ├── config/
│   │   ├── db.php                   ← PDO connection (from Core/config/)
│   │   └── firebase-service-account.json
│   ├── lib/                         ← Core PHP libraries (from Core/lib/)
│   │   ├── helpers.php              ← h(), json_ok(), json_err(), csrf_*
│   │   ├── notify.php               ← Email + push notifications
│   │   ├── ziina.php                ← Payment processing (AED)
│   │   ├── ai-system.php            ← Claude/OpenAI integration
│   │   ├── ai-helpers.php
│   │   ├── ai-governance.php
│   │   └── [35 other lib files]
│   ├── includes/
│   │   ├── analytics_tracker.php
│   │   └── track_event.php
│   ├── interactive-books/           ← Book lesson PHP files
│   └── tools/                       ← Admin utilities
│
├── database/
│   ├── migrations/                  ← New migration files only
│   ├── existing/                    ← From Core/database/ (reference)
│   │   ├── analytics.sql
│   │   ├── articles.sql
│   │   ├── mobile_app_integration.sql
│   │   ├── site_settings.sql
│   │   ├── student_briefs.sql
│   │   └── videos.sql
│   └── schema.sql                   ← Full schema reference
│
└── tests/
    ├── e2e/                         ← Playwright tests
    │   ├── public/
    │   ├── student/
    │   ├── teacher/
    │   ├── owner/
    │   ├── parent/
    │   ├── academy/
    │   └── media-buyer/
    └── unit/
```

---

## 4. Feature Folder Convention

Every feature MUST follow this structure:

```
feature-name/
├── index.tsx           ← Main entry/export
├── [FeatureName].tsx   ← Root component (layout only)
├── components/         ← Feature-private components
├── hooks/              ← Feature-private hooks
│   └── use[Feature].ts
├── api.ts              ← All fetch calls for this feature
├── types.ts            ← Feature-specific TypeScript types
├── animations.ts       ← Framer Motion variants
└── README.md           ← Feature docs (required)
```

---

## 5. Component Template

```tsx
// components/[ComponentName].tsx
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'

export interface [ComponentName]Props {
  // always export the interface
}

export const [ComponentName]: FC<[ComponentName]Props> = (props) => {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {/* max 200 lines */}
    </motion.div>
  )
}
```

---

## 6. MCP Usage Guide

### Filesystem MCP
- Always use to create/read/write files — never assume paths
- Create feature folder + README in one operation
- Check if file exists before creating

### Sequential Thinking MCP
- Trigger before: any task with 3+ steps, architectural decisions, refactors
- Pattern: Think → Plan → Validate → Execute
- For complex features: write `[feature]/PLAN.md` first

### Memory MCP
- Save after every major decision or pattern established
- Check at start of EVERY session before doing anything
- Save: component patterns, API contracts, design decisions, known issues

### Context Engineering
- Include at session start: role + current feature + relevant PHP files
- Use `@file` references in Claude Code
- One feature per session = best quality output

### Playwright
- Write E2E test immediately after completing each feature
- Location: `tests/e2e/[role]/[feature].spec.ts`
- Must cover: happy path + error state + mobile 375px

### Framer Motion
- Page transitions: `AnimatePresence` + `motion.div`
- Lists: `staggerChildren` variants
- Modals/drawers: spring physics
- All interactive cards: `whileHover` with `y: -2`

### Marketing Skills (Public pages only)
- Landing page: hero + social proof + CTA hierarchy
- Pricing: urgency + plan comparison + trust signals
- Checkout: minimal friction + trust badges
- Post-payment: confirmation + next steps clear

### Impeccable (before every commit)
- Zero TypeScript errors (`npm run type-check`)
- Zero ESLint warnings (`npm run lint`)
- No `console.log` in production files
- No `any` types
- No files over 200 lines
- All features have README.md

---

## 7. Brand & Environment

```
Domain:         mshabibanabil.com
Email from:     info@mshabibanabil.com
Email to:       ms.habibanabil@gmail.com
Teacher pass:   Habiba2026#Smart (never expose in frontend)
Timezone:       Asia/Dubai
Currency:       AED (Ziina, fils = AED × 100)
Push service:   Firebase FCM
AI provider:    Anthropic Claude API
DB:             u807160300_smarthomework @ localhost
```

---

## 8. Code Quality Standards

```
TypeScript strict mode:     ON
No any types:               ENFORCED
No console.log production:  ENFORCED
Max component lines:        200
Max function lines:         50
Naming:                     PascalCase components | camelCase fns | UPPER_SNAKE constants
Import order:               React → Third-party → Internal (@/) → Types
```

---

## 9. Git Workflow

```bash
# Branch naming
feature/[role]/[feature-name]   # feature/student/flashcards
fix/[role]/[issue]              # fix/teacher/homework-save
refactor/[scope]/[what]         # refactor/core/auth-guard

# Commit format (Conventional Commits)
feat(student): add flashcard spaced repetition
fix(teacher): correct homework pagination
refactor(core): extract notification hook
docs(owner): update analytics README
```

---

## 10. Session Checklist

**Start of session:**
- [ ] Check Memory MCP for this project
- [ ] Confirm current Phase in REBUILD_PLAN.md
- [ ] Read the relevant role README
- [ ] Check `git status`

**End of session:**
- [ ] Save decisions to Memory MCP
- [ ] Update DECISIONS.md if architecture changed
- [ ] Write Playwright tests for completed features
- [ ] Update feature README.md
- [ ] Run: `npm run type-check && npm run lint`
