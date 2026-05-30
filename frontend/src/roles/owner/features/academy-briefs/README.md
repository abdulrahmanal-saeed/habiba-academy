# Owner — Academy Briefs

Review and action student briefs submitted via partner academies.

## Routes
- `/owner/academy-briefs` — AcademyBriefsPage (filterable list)
- `/owner/academy-briefs/:id` — AcademyBriefDetailPage

## Backend
- `GET  /api/owner/academy-briefs.php` — list all briefs
- `GET  /api/owner/academy-briefs.php?id=N` — single brief detail
- `POST /api/owner/academy-briefs.php` action=update_status — update status + notes + notify academy

## Status flow
`submitted` → `under_review` → `contacted` → `trial_scheduled` → `enrolled` | `not_interested` | `converted_to_student`

## Key notes
- `converted_to_student` status locks the form (read-only)
- Platform notify is sent to the academy on every status update
