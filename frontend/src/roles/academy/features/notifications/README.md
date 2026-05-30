# Notifications — Academy Role

## What it does
Displays notifications sent to the academy (e.g., brief status updates from the teacher). Supports bulk mark-all-read with optimistic UI via TanStack Query mutation.

## Roles
Academy only (`/academy/notifications`)

## Components
| Component | Purpose |
|-----------|---------|
| `NotificationCard` | Card with title, body, date; highlighted border when unread; optional action link |
| `AcademyNotificationsPage` | List + "تحديد الكل كمقروء" button |

## API
- `GET /api/academy/notifications` → `NotificationsData` (notifications array)
- `POST /api/academy/notifications` (mark all read) → `{ ok: true }`
