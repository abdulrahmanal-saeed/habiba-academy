# Owner Dashboard

Owner-only KPI overview combining student engagement, portal stats, and revenue summary.

## Role
Owner only (`/owner`)

## Components
- `DashboardPage` — page layout, orchestrates query + layout
- `KpiGrid` — 6 student engagement KPI cards
- `PortalsGrid` — 3 portal portal stat cards (academies, parents, media buyers) with nav links
- `RevenueCard` — total revenue + plan breakdown + status pills

## API
`GET /api/owner/home` → `OwnerDashboardData`

## Key patterns
- staleTime: 60_000
- KpiGrid uses `stagger` + `cardVariant` from design-system animations
- PortalsGrid items link to `/owner/academies`, `/owner/parents`, `/owner/media-buyers`
