# Campaigns — Media Buyer Role

## What it does
Visit analytics dashboard: traffic source breakdown, device breakdown, and a table of the 20 most recent tracked visits.

## Roles
Media Buyer only (`/media-buyer/campaigns`)

## Components
| Component | Purpose |
|-----------|---------|
| `SourceBreakdownList` | Ranked list of traffic sources by visit count |
| `DeviceBreakdownList` | Ranked list of device types by visit count |
| `RecentVisitsTable` | Table: time, source, device, country, duration, last page |
| `CampaignsPage` | Composes all 3 panels |

## API
- `GET /api/media-buyer/stats` → `MediaBuyerStatsData` (sources, devices, recent_visits, commissions)
