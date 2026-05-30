# Dashboard — Media Buyer Role

## What it does
Main landing page for the media buyer portal. Shows a 9-card KPI grid (orders, visits, attribution) and quick-access links to tracking, campaigns, and commissions pages.

## Roles
Media Buyer only (`/media-buyer`)

## Components
| Component | Purpose |
|-----------|---------|
| `KPIStrip` | 9 animated KPI cards (3×3 grid) |
| `MediaBuyerDashboardPage` | Welcome header + KPI strip + quick nav links |

## API
- `GET /api/media-buyer/home` → `MediaBuyerHomeData` (buyer + kpis + tracking links)

## Notes
- If home.php returns 403 `agreement_required`, hook redirects to `/media-buyer/agreement`
- KPIs include: orders, paid orders, commission rate, visits, sessions, avg duration, 30-day visitors, active attributions, conversions
