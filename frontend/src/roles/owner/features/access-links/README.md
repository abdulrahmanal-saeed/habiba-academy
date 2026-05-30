# Owner — Access Links

Read-only page showing portal login URLs and access codes for all portal users.

## Routes
- `/owner/access-links` — AccessLinksPage

## Backend
- `GET /api/owner/access-links` — academies + parents + media_buyers + login_urls

## Groups
| Group | Table | Sub field | Login URL |
|-------|-------|-----------|-----------|
| Academies | academies | contact_name | /academy/login.php |
| Parents | parent_contacts | whatsapp | /parent/login.php |
| Media Buyers | media_buyers | email | /media-buyer/login.php |

## Key notes
- No mutations — read-only page
- Copy button uses navigator.clipboard with textarea fallback
- Copied! feedback resets after 1.2s via setTimeout
- base_url from APP_BASE_URL env (defaults to https://mshabibanabil.com)
