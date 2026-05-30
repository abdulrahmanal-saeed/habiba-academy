# Teacher Settings Feature

Site settings manager. Uses optimistic toggle updates with automatic rollback on error.

## Roles

Teacher (admin access)

## Components

- `SettingsPage` — page at `/teacher/settings`, groups settings by category
- `SettingsGroup` — card container for a group of settings
- `SettingToggle` — animated boolean toggle with optimistic update

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `teacher/settings.php` | GET | All site settings as key→value map |
| `teacher/settings.php` | POST (form) | Update one setting |

## Patterns

- Optimistic update: `onMutate` sets new value immediately, `onError` rolls back
- `KNOWN_SETTINGS` array drives the UI — unknown keys from DB shown as raw key/value
- Toggle fires `onChange(key, enabled ? '0' : '1')`
