# Owner Settings

Three-section settings page for managing site-wide configuration.

## Role
Owner only (`/owner/settings`)

## Sections
- `ContentFlagsSection` — 4 animated feature toggles (enable/show videos + articles)
- `ProfileSection` — teacher photo upload + WhatsApp number
- `SocialLinksSection` — Instagram, Facebook, YouTube, TikTok URL inputs

## Components
- `SettingToggle` — animated spring toggle switch (owner-specific, mirrors teacher version)

## API
- `GET /api/owner/settings` → `{ flags, profile }`
- `POST /api/owner/settings` JSON action=`update_flags`
- `POST /api/owner/settings` FormData action=`update_profile`

## Key patterns
- `updateFlags` uses optimistic update: immediate setQueryData + rollback on error
- Photo upload uses FileReader for live preview before submit
- Social links and profile use separate save buttons to avoid coupling
