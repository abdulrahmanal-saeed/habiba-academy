# Dashboard — Academy Role

## What it does
Academy home screen: academy name, 3 KPI cards (students / completed sessions / upcoming sessions), and a compact linked-student list with a link to the full students page.

## Roles
Academy only (`/academy`)

## Components
| Component | Purpose |
|-----------|---------|
| `AcademyKPIStrip` | 3 animated KPI cards |
| `AcademyStudentList` | Compact student rows with active badge + session counts |
| `AcademyDashboardPage` | Composes all; includes "New Brief" CTA |

## API
- `GET /api/academy/home` → `AcademyHomeData` (academy info + students + kpis)
