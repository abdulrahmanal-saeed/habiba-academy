# Agreement — Media Buyer Role

## What it does
Gate page shown before the media buyer can access the dashboard. Displays the active agreement template, requires typing the user's legal name, and records acceptance to the DB.

## Roles
Media Buyer only (`/media-buyer/agreement`) — no layout nav shown

## Components
| Component | Purpose |
|-----------|---------|
| `AgreementPage` | Content scroll box + typed_name input + accept button |

## API
- `GET /api/media-buyer/agreement` → `AgreementData` (template + already_accepted flag)
- `POST /api/media-buyer/agreement` body: `{ typed_name }` → accept

## Flow
1. home.php returns 403 `agreement_required`
2. `useMediaBuyerHome` meta.onError redirects to `/media-buyer/agreement`
3. User reads + accepts → navigate to `/media-buyer`
