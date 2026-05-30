# Dashboard — Parent Role

## What it does
Displays the parent's home screen: welcome greeting, KPI strip (student count + upcoming sessions), per-child balance cards with session progress, and an upcoming sessions list.

## Roles
Parent only (`/parent`)

## Components
| Component | Purpose |
|-----------|---------|
| `ParentKPIStrip` | 2 KPI cards: enrolled students + upcoming sessions |
| `StudentBalanceCard` | Per-child card with session balance, progress bar, links to homework/progress |
| `UpcomingSessionsList` | Animated list of upcoming planned/rescheduled sessions |
| `ParentDashboardPage` | Root page — composes all, handles loading/error |

## API
- `GET /api/parent/home` → `ParentHomeData`

## Known limitations
- Balance data may be `null` if student has no active package (handled gracefully)
- Upcoming sessions are capped at 12 from the API
