# Design System — Habiba Nabil Arabic Academy

Phase 13 UI/UX Overhaul. All components use CSS variables from `tokens.css` — never hardcoded hex values.

## Roles
All roles (student, teacher, owner, parent, academy, media-buyer, public).

## Components

### Primitives (custom, brand-direct)
| Component | Notes |
|-----------|-------|
| `Button` | 5 variants: primary/secondary/ghost/danger/link. Framer Motion tap+hover. |
| `Input` | With label, error, hint, icon slots. |
| `Textarea` | Multi-line, same API as Input. |
| `Card` | 3 variants: default/flat/interactive. |
| `Badge` | Status badges with semantic colors. |
| `Avatar` | Image + fallback initials. |
| `Spinner` | 3 sizes. |
| `Modal` | Full a11y: focus trap, Escape, scroll lock. |
| `Toast` / `toast` | Imperative API: `toast.success('Done')`. |

### Radix-based (accessibility + brand styling)
| Component | Radix Primitive |
|-----------|----------------|
| `Drawer` | `@radix-ui/react-dialog` — side sheet |
| `Tabs` / `TabPanel` | `@radix-ui/react-tabs` |
| `Select` / `SelectItem` | `@radix-ui/react-select` |
| `DropdownMenu*` | `@radix-ui/react-dropdown-menu` |
| `Tooltip` / `TooltipProvider` | `@radix-ui/react-tooltip` |
| `Progress` | `@radix-ui/react-progress` |
| `Switch` | `@radix-ui/react-switch` |
| `Separator` | `@radix-ui/react-separator` |
| `Label` | `@radix-ui/react-label` |
| `ScrollArea` | `@radix-ui/react-scroll-area` |

### Utility components
| Component | Notes |
|-----------|-------|
| `Skeleton` / `SkeletonCard` | Shimmer loading placeholders. |
| `EmptyState` | No-data state with icon/title/description/action. |

## Utilities
`cn(...classes)` — clsx + tailwind-merge. Use everywhere for conditional classes.

## Theme
`useTheme()` — returns `{ theme, isDark, setTheme, toggle }`.
`ThemeToggle` — `variant="icon"` (single button) or `variant="group"` (3-way strip).

## API Endpoints
None — design system only.

## Known Limitations
- `Drawer` does not support nested drawers.
- `Select` is RTL-aware via CSS logical properties but test carefully in production.
