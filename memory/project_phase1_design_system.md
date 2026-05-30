---
name: Phase 1 Design System — completed
description: What was built in Phase 1 and key decisions made
type: project
---

Phase 1 Design System completed: tokens.css, animations.ts, tailwind.config.ts, Button.tsx.

**Why:** Foundation for all role UIs — every component depends on these tokens.

**How to apply:** All future components import from `@/design-system/`. Never add colors outside tokens.css.

Key decisions:
- Tailwind v4 with `@tailwindcss/vite` plugin — NO legacy tailwind.config theme. Theme extensions via `@theme inline` in tokens.css.
- `@variant dark (&:where([data-theme=dark], [data-theme=dark] *))` in tokens.css enables `dark:` utilities.
- Tailwind color utilities (`bg-accent`, `text-ink`, etc.) work because `@theme inline { --color-accent: var(--accent) }` maps them to runtime CSS vars — dark mode Just Works.
- Button uses ONLY Tailwind utility classes for colors (no inline hex). Framer Motion handles `whileTap` / `whileHover` motion only.
- `@` alias = `src/` (set in vite.config.ts + tsconfig.app.json).
- index.css: `@import "tailwindcss"` → `@config` → `@import tokens.css`.
