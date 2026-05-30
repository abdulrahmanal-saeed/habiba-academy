---
name: Tailwind v4 configuration approach
description: How to configure Tailwind v4 in this project — CSS-first, not JS config
type: feedback
---

This project uses Tailwind CSS v4 with `@tailwindcss/vite`. Theme extensions belong in CSS via `@theme inline`, NOT in `tailwind.config.ts`.

**Why:** Tailwind v4 is CSS-first. The JS config only handles content paths and plugins. Putting colors/fonts in the JS config does nothing useful.

**How to apply:** When adding new design tokens, add CSS vars to `:root` and `[data-theme="dark"]` in tokens.css, then add `--color-newtoken: var(--newtoken)` to the `@theme inline` block. Never add `theme.extend.colors` to the JS config.
