# Owner Analytics

Full site analytics across 5 tabs: Overview, Funnel, Revenue, Engagement, Media Buyers.

## Role
Owner only (`/owner/analytics`)

## Components
- `OverviewCards` — 4 KPI cards: total_visits, unique_visitors, page_views, active_now
- `DailyChart` — SVG bar chart, last 30 active days
- `DevicePie` — pill-bar device breakdown (no pie chart lib)
- `HourlyHeatmap` — 24-cell heatmap of traffic by hour
- `FunnelChart` — animated horizontal funnel bars (7 steps)
- `RevenueStats` — paid totals + by_plan table + by_status pills
- `MediaBuyersTable` — sortable attribution table
- `TopPagesTable` — bar-ranked top 10 pages
- `LowActivityList` — students inactive > 14 days
- `RealtimePanel` — live sessions polling every 10s via `useRealtime`

## API
- `GET /api/owner/analytics` → full `AnalyticsData` (staleTime: 120_000)
- `GET /api/owner/analytics?partial=realtime` → `RealtimeData` (refetchInterval: 10_000)

## Key patterns
- SVG-only charts — zero chart dependencies
- Realtime: separate `useRealtime` hook so it polls independently from main data
