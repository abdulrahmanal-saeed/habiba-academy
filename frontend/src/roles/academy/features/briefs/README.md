# Briefs — Academy Role

## What it does
Submit and track student briefs sent to the teacher. Each brief captures full student info (age, goals, schedule, etc.) and tracks its review status from submission through acceptance.

## Roles
Academy only (`/academy/briefs`, `/academy/briefs/new`, `/academy/briefs/:id`)

## Components
| Component | Purpose |
|-----------|---------|
| `BriefStatusBadge` | Color-coded status chip (submitted / reviewing / accepted / rejected) |
| `BriefCard` | Summary card with status, student name, goal excerpt, date |
| `NewBriefForm` | 14-field submission form with validation |
| `BriefsPage` | Grid list + empty state + "بريف جديد" CTA |
| `NewBriefPage` | Wraps NewBriefForm with back link |
| `BriefDetailPage` | Read-only field grid driven by FIELDS array |

## API
- `GET /api/academy/briefs` → `BriefsData` (briefs list)
- `GET /api/academy/briefs?id=N` → `BriefDetail`
- `POST /api/academy/briefs` body: `NewBriefPayload` → `{ brief_id }`

## Status Flow
`submitted` → `reviewing` → `accepted` | `rejected`
