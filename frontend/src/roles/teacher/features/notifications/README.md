# Teacher Notifications Feature

In-app notification bell for the teacher. Polls every 30s for new notifications.

## Roles

Teacher (only)

## Components

- `NotificationBell` — bell icon with unread badge, used in TeacherLayout header
- `NotificationDrawer` — spring slide-in panel with notification list + mark-all-read
- `NotificationItem` — single notification row with type icon, mark-read on click

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `teacher/notifications.php` | GET | List notifications + unread count |
| `teacher/notifications.php` | POST (form) | Mark single or all as read |

## Patterns

- `useNotifications` hook: `refetchInterval: 30_000` for live badge count
- Mark read triggers `invalidateQueries` to refresh badge immediately
- `is_read = false` notifications get accent-soft background
