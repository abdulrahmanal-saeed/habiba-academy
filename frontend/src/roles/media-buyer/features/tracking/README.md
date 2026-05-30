# Tracking Links — Media Buyer Role

## What it does
Displays 5 pre-built tracking URLs (homepage, pricing, 3 checkout plans) with one-click copy-to-clipboard. Uses the same data as the dashboard (no extra API call).

## Roles
Media Buyer only (`/media-buyer/tracking`)

## Components
| Component | Purpose |
|-----------|---------|
| `TrackingLinkRow` | Label + read-only URL input + copy button with "تم النسخ" feedback |
| `TrackingPage` | 5 tracking link rows in a card |

## API
- Re-uses `GET /api/media-buyer/home` (links field) via `useMediaBuyerHome` hook
