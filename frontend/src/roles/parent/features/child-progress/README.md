# Child Progress — Parent Role

## What it does
Shows a parent the session package balance for a specific child: package name, expiry date, completed/remaining/total KPIs, and an animated progress bar.

## Roles
Parent only (`/parent/children/:id/progress`)

## Components
| Component | Purpose |
|-----------|---------|
| `BalanceKPIStrip` | Package name, expiry date, 3 KPI cards, animated progress bar |
| `ChildProgressPage` | Root page — reads `:id` from URL, fetches + renders |

## API
- `GET /api/parent/child-progress?id=N` → `ChildProgressData`
  - Returns 403 if student is not linked to this parent
  - `balance` fields may be null/0 if no active package

## Known limitations
- Read-only — progress data is derived from lesson_package_balances
