# Commissions — Media Buyer Role

## What it does
Commission ledger showing the last 20 commission records with amount, status badge, and date.

## Roles
Media Buyer only (`/media-buyer/commissions`)

## Components
| Component | Purpose |
|-----------|---------|
| `CommissionStatusBadge` | Color-coded status: pending→warning, paid→success, cancelled→danger |
| `CommissionLedger` | Staggered row list with empty state |
| `CommissionsPage` | Header + ledger |

## API
- Re-uses `GET /api/media-buyer/stats` (commissions field) via `useMediaBuyerStats` hook
