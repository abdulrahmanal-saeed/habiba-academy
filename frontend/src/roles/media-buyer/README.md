# Media Buyer Role

## Overview
Portal for media buyers (marketing partners) who drive traffic to Habiba Nabil via paid campaigns. They track their referral links, monitor visit/attribution stats, and view commission records.

## Auth
- Login: `email` or `whatsapp` + `access_code` → `$_SESSION['media_buyer_id']`
- Agreement gate: must accept active agreement template before dashboard access
- All API endpoints call `portals_ensure_schema($pdo)` + `media_buyer_ensure_schema($pdo)`

## Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/media-buyer` | `MediaBuyerDashboardPage` | 9-KPI overview + quick links |
| `/media-buyer/tracking` | `TrackingPage` | 5 campaign tracking URLs |
| `/media-buyer/campaigns` | `CampaignsPage` | Sources, devices, recent visits |
| `/media-buyer/commissions` | `CommissionsPage` | Commission ledger |
| `/media-buyer/notifications` | `MediaBuyerNotificationsPage` | Push notifications |
| `/media-buyer/agreement` | `AgreementPage` | Agreement acceptance gate |

## Features
| Feature | Path |
|---------|------|
| Dashboard | `features/dashboard/` |
| Tracking Links | `features/tracking/` |
| Campaigns/Analytics | `features/campaigns/` |
| Commissions | `features/commissions/` |
| Notifications | `features/notifications/` |
| Agreement | `features/agreement/` |

## Backend
| Endpoint | File |
|----------|------|
| `GET /api/media-buyer/home` | `backend/api/media-buyer/home.php` |
| `GET /api/media-buyer/stats` | `backend/api/media-buyer/stats.php` |
| `GET/POST /api/media-buyer/notifications` | `backend/api/media-buyer/notifications.php` |
| `GET/POST /api/media-buyer/agreement` | `backend/api/media-buyer/agreement.php` |

## Key Patterns
- `stats.php` serves both campaigns + commissions (shared `useMediaBuyerStats` hook)
- `tracking` re-uses `useMediaBuyerHome` (no extra API call for links)
- Agreement gate: 403 `agreement_required` → redirect to `/media-buyer/agreement`
- Copy-to-clipboard: `navigator.clipboard` with textarea fallback
- `CommissionLedger` shares types with `CampaignsPage` via `campaigns/types.ts`
