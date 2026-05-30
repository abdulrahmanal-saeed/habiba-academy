# Notifications — Media Buyer Role

## What it does
Lists notifications sent to the media buyer (e.g. commission updates from the owner). Supports bulk mark-all-read.

## Roles
Media Buyer only (`/media-buyer/notifications`)

## Components
| Component | Purpose |
|-----------|---------|
| `NotificationCard` | Card with accent border when unread, optional action link |
| `MediaBuyerNotificationsPage` | List + "تحديد الكل كمقروء" button |

## API
- `GET /api/media-buyer/notifications` → `NotificationsData`
- `POST /api/media-buyer/notifications` → mark all as read
