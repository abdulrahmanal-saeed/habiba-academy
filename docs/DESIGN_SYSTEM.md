# DESIGN_SYSTEM.md — Habiba Nabil Arabic Academy
# Design System Reference

> All tokens taken directly from `Core/assets/css/app.css`
> DO NOT invent new colors — use what's defined here.

---

## Brand Identity

**Brand**: Habiba Nabil Arabic Academy
**Domain**: mshabibanabil.com
**Feel**: Warm, professional, Arabic-teaching focused
**Primary color**: Teal `#0d4f4f` — brand identity
**Accent secondary**: `#1a6b5a` — deeper green-teal
**Mint highlight**: `#a8e6cf` — light, fresh
**Personality**: Trusted Arabic tutor × Modern EdTech

---

## Color Tokens (from real app.css)

```css
/* design-system/tokens.css — copied from Core/assets/css/app.css */

:root {
  /* ── Backgrounds ──────────────────────────────────── */
  --bg:              #f4fbf8;
  --bg-alt:          #eaf6f1;
  --surface:         #fbfefd;
  --surface-soft:    #f7fcfa;
  --card:            #fbfefd;
  --card-hover:      #f5fbf8;

  /* ── Text ─────────────────────────────────────────── */
  --ink:             #102322;
  --ink-soft:        #2f4c49;
  --muted:           #607875;
  --muted-light:     #8ba09d;

  /* ── Borders & Shadows ────────────────────────────── */
  --border:          rgba(13, 79, 79, 0.13);
  --border-soft:     rgba(13, 79, 79, 0.07);
  --shadow-sm:       0 1px 3px rgba(13,79,79,.06), 0 1px 2px rgba(16,35,34,.04);
  --shadow-md:       0 6px 18px rgba(13,79,79,.10);
  --shadow-lg:       0 12px 34px rgba(13,79,79,.14);

  /* ── Brand Accent — TEAL ──────────────────────────── */
  --accent:          #0d4f4f;   /* PRIMARY brand color */
  --accent-2:        #1a6b5a;   /* Secondary teal */
  --accent-mint:     #a8e6cf;   /* Light mint */
  --accent-hover:    #0a4242;
  --accent-soft:     rgba(13, 79, 79, .10);
  --accent-soft-strong: rgba(13, 79, 79, .16);
  --accent-rgb:      13, 79, 79;
  --primary:         var(--accent);
  --primary-rgb:     var(--accent-rgb);

  /* ── Status Colors ────────────────────────────────── */
  --success:         #16a34a;
  --success-bg:      #f0fdf4;
  --warning:         #d97706;
  --warning-bg:      #fffbeb;
  --danger:          #dc2626;
  --danger-bg:       #fef2f2;
  --info:            #0284c7;
  --info-bg:         #f0f9ff;

  /* ── Shapes ───────────────────────────────────────── */
  --radius-xs:       0.375rem;
  --radius-sm:       0.5rem;
  --radius:          0.75rem;
  --radius-lg:       1rem;
  --radius-xl:       1.25rem;

  /* ── Controls ─────────────────────────────────────── */
  --control-height:     44px;
  --control-height-sm:  36px;
  --focus-ring:         0 0 0 3px rgba(var(--accent-rgb), .18);
  --focus-ring-strong:  0 0 0 4px rgba(var(--accent-rgb), .20);
  --disabled-opacity:   .62;
  --table-head-bg:      rgba(13, 79, 79, .045);

  /* ── Navigation ───────────────────────────────────── */
  --nav-bg:          rgba(251, 254, 253, 0.9);
  --nav-border:      rgba(13, 79, 79, 0.10);

  /* ── Transition ───────────────────────────────────── */
  --transition: background-color .2s ease, border-color .2s ease,
                color .2s ease, box-shadow .2s ease,
                transform .2s ease, opacity .2s ease;
}

/* ── Dark Mode ─────────────────────────────────────── */
[data-theme="dark"] {
  --bg:              #0c1615;
  --bg-alt:          #12211f;
  --surface:         #142522;
  --surface-soft:    #10201e;
  --card:            #172a27;
  --card-hover:      #1c332f;

  --ink:             #e7f4ef;
  --ink-soft:        #bdd4ce;
  --muted:           #91aaa4;
  --muted-light:     #718b85;

  --border:          rgba(168, 230, 207, 0.14);
  --border-soft:     rgba(168, 230, 207, 0.08);
  --shadow-sm:       0 1px 3px rgba(2,8,7,.28);
  --shadow-md:       0 6px 18px rgba(2,8,7,.36);
  --shadow-lg:       0 12px 34px rgba(2,8,7,.46);

  /* Accent stays teal, lighter in dark mode */
  --accent:          #2ab5a0;
  --accent-hover:    #8edec3;
  --accent-soft:     rgba(168, 230, 207, .12);
  --accent-soft-strong: rgba(168, 230, 207, .18);
  --accent-mint:     #a8e6cf;

  --success-bg:      rgba(22, 163, 74, .12);
  --warning-bg:      rgba(217, 119, 6, .12);
  --danger-bg:       rgba(220, 38, 38, .12);
  --info-bg:         rgba(2, 132, 199, .12);

  --nav-bg:          rgba(12, 22, 21, 0.92);
  --nav-border:      rgba(168, 230, 207, 0.10);
  --table-head-bg:   rgba(168, 230, 207, .07);
}
```

---

## Typography

### Font Stack (from real app.css)

```css
/* Primary UI font — Thmanyah (already in assets/fonts/thmanyah/) */
font-family: 'ThmanyahSans', 'Cairo', 'DM Sans', system-ui, sans-serif;

/* Available weights from the 12 woff2 files: */
/* ThmanyahSans:  Light(300), Regular(400), Medium(500), Bold(700), Black(900) */
/* ThmanyahDisplay: Regular, Medium, Bold, Black */
/* ThmanyahText: Regular, Medium, Bold */
```

### Type Scale

```
text-xs:    0.75rem   / 12px  — labels, captions, badges
text-sm:    0.875rem  / 14px  — secondary text, table cells
text-base:  1rem      / 16px  — body text
text-lg:    1.125rem  / 18px  — lead paragraphs
text-xl:    1.25rem   / 20px  — card titles
text-2xl:   1.5rem    / 24px  — section headings
text-3xl:   1.875rem  / 30px  — page headings
text-4xl:   2.25rem   / 36px  — hero subtext
text-5xl:   3rem      / 48px  — landing hero
```

---

## Spacing (4px base grid)

```
4px   xs    tight gaps, icon margins
8px   sm    inline spacing, small padding
12px  md    component internal padding
16px  base  standard padding (cards, inputs)
24px  lg    section padding, card gaps
32px  xl    large padding
48px  2xl   section gaps
64px  3xl   hero padding
96px  4xl   large section spacing
```

---

## Component Patterns

### Card

```tsx
<motion.div
  className="bg-card border rounded-lg shadow-sm p-6"
  style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
  variants={cardVariant}
  whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
  transition={{ type: 'spring', stiffness: 300 }}
>
```

### Button Variants

```tsx
// Primary — teal solid
className="bg-accent text-white px-4 py-2 font-semibold rounded-lg 
           hover:bg-accent-hover transition-all"
style={{ background: 'var(--accent)' }}

// Secondary — teal outline
className="border-2 px-4 py-2 font-semibold rounded-lg transition-all"
style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}

// Ghost — minimal
style={{ color: 'var(--accent)' }}

// Danger
style={{ background: 'var(--danger)', color: '#fff' }}
```

### Status Badges

```tsx
// Active
<span style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
      className="text-xs px-2 py-1 rounded-full font-medium">Active</span>

// Pending
<span style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}
      className="text-xs px-2 py-1 rounded-full font-medium">Pending</span>
```

---

## Animation Variants (Framer Motion)

```typescript
// design-system/animations.ts

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}

export const cardVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
}

export const pageTransition = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } }
}

export const modalVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 350 }
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }
}

export const drawerVariant = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { x: '100%', transition: { duration: 0.2 } }
}
```

---

## Sidebar Layout (from existing CSS pattern)

The sidebar pattern from `app.css` uses `student-sidebar` class conventions:

```
Width: min(300px, 86vw)
Position: fixed left (LTR) / fixed right (RTL)
Z-index: 1090 (above content, below modals)
Background: var(--card)
Border: 1px solid var(--border)
Shadow: var(--shadow-lg)
Transform: translateX(-105%) → translateX(0) when open
Transition: 0.18s ease
```

React implementation: wrap in Framer Motion `drawerVariant`.

---

## RTL Support

```css
/* ALWAYS use logical properties */
margin-inline-start:  /* not margin-left */
padding-inline-end:   /* not padding-right */
border-inline-start:  /* not border-left */
inset-inline-start:   /* not left: 0 */
text-align: start;    /* not text-align: left */
```

```tsx
// RTL-aware animation hook
const isRTL = document.dir === 'rtl'
const slideVariant = {
  hidden: { x: isRTL ? 30 : -30, opacity: 0 },
  visible: { x: 0, opacity: 1 }
}
```

---

## Icon System

Primary: **Lucide React** (consistent with Bootstrap Icons pattern in original)

```tsx
import { Bell, BookOpen, Users, BarChart3, ChevronRight } from 'lucide-react'

// Sizes:
// 16px — inline, tight
// 20px — default
// 24px — sidebar nav, headers
// 32px — empty states
```

---

## Assets Available (from Core/assets/)

```
fonts/thmanyah/
  ├── thmanyah-sans-light.woff2
  ├── thmanyah-sans-regular.woff2
  ├── thmanyah-sans-medium.woff2
  ├── thmanyah-sans-bold.woff2
  ├── thmanyah-sans-black.woff2
  ├── thmanyah-display-regular.woff2
  ├── thmanyah-display-medium.woff2
  ├── thmanyah-display-bold.woff2
  ├── thmanyah-display-black.woff2
  ├── thmanyah-text-regular.woff2
  ├── thmanyah-text-medium.woff2
  └── thmanyah-text-bold.woff2

img/
  ├── logo.svg          ← Main logo
  ├── favicon.png
  ├── habiba.jpg        ← Teacher photo
  ├── icon-180.png      ← PWA icon
  ├── icon-192.png
  ├── icon-512.png
  └── books/arabic-daily-life-cover.png

audio/leveltest/        ← a2_1.mp3 through c2_2.mp3 (10 files)
audio/books/beginner/   ← Lesson 2 & 3 audio
```
