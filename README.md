# Habiba Nabil Arabic Academy — Rebuild

**Domain**: mshabibanabil.com  
**Stack**: React 19 + TypeScript + Vite + Tailwind v4 + Framer Motion  
**Backend**: PHP 8.2 (existing, from `Core/`)  
**Database**: MySQL (`u807160300_smarthomework`)

---

## Quick Start

```bash
# 1. Install MCPs
bash scripts/install-mcps.sh

# 2. Create React app
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install framer-motion @tanstack/react-query zustand react-router-dom react-hook-form lucide-react
npm install -D tailwindcss @tailwindcss/vite playwright @playwright/test typescript-eslint prettier

# 3. Create folders
bash scripts/create-structure.sh

# 4. Copy backend from source
# From: D:\Habiba\web + app\New\Core\
# To:   D:\Habiba\web + app\Rebuild Habiba Website\backend\
# See REBUILD_PLAN.md Phase 0

# 5. Open Claude Code
claude .
```

---

## Essential Reading (in order)

| File | Purpose |
|------|---------|
| [CLAUDE.md](./CLAUDE.md) | Master instructions for Claude Code |
| [AI_RULES.md](./AI_RULES.md) | 16 hard rules — never break |
| [REBUILD_PLAN.md](./REBUILD_PLAN.md) | 12-phase plan with PHP references |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design + PHP API map |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | Real tokens from app.css |
| [docs/API_CONTRACTS.md](./docs/API_CONTRACTS.md) | TypeScript interfaces |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Architecture decisions (ADRs) |
| [scripts/new-session.md](./scripts/new-session.md) | Copy-paste session prompts |

---

## Roles & Features

| Role | Features | Phase |
|------|----------|-------|
| Public Visitor | Landing, Level Test, Checkout (Ziina/AED), Articles | Phase 3 |
| Teacher / Admin | Students, Homework, Reviews, 15 AI Tools, Lesson Planning | Phase 4 |
| Student | Dashboard, Homework, Book, Flashcards, Progress | Phase 5 |
| Owner | Analytics, Payments, Book Launch, Help CMS, Settings | Phase 6 |
| Parent | Child progress, homework, review results | Phase 7 |
| Academy Partner | Briefs, Student status, Communication | Phase 8 |
| Media Buyer | Campaigns, Attribution, Commissions | Phase 9 |

---

## Brand

```
Primary color:  #0d4f4f  (teal) — var(--accent)
Secondary:      #1a6b5a  — var(--accent-2)
Mint:           #a8e6cf  — var(--accent-mint)
Font:           ThmanyahSans (12 woff2 files in assets/fonts/thmanyah/)
```

---

## Current Phase

**Phase 0 — Foundation & Setup** 🔄

See [REBUILD_PLAN.md](./REBUILD_PLAN.md) for full progress.
