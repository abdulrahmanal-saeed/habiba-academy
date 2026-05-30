# Owner — Media Buyers

Manage media buyer accounts and their commission agreement template.

## Routes
- `/owner/media-buyers` — MediaBuyersPage
- `/owner/media-buyers/agreement` — MediaBuyerAgreementPage

## Backend
- `GET  /api/owner/media-buyers.php` — buyers list with stats (visits, attributions, paid orders, revenue)
- `GET  /api/owner/media-buyers.php?action=agreement` — active agreement template
- `POST /api/owner/media-buyers.php` action=save — create buyer (access code MB-NNNNNN)
- `POST /api/owner/media-buyers.php` action=delete — soft delete
- `POST /api/owner/media-buyers.php` action=save_agreement — new version (deactivates previous)

## Key notes
- Stats use LEFT JOIN — zero values appear even with no campaigns yet
- Agreement versioning: each save deactivates all previous rows and inserts a new one
- `requires_reacceptance` flag can force media buyers to re-sign on next login
