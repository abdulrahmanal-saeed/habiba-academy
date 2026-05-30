# Students — Academy Role

## What it does
Full list of students linked to this academy with search by name or login code. Shows active status badge and session counts per student.

## Roles
Academy only (`/academy/students`)

## Components
| Component | Purpose |
|-----------|---------|
| `StudentStatusRow` | Row with name, login code, active badge, completed + upcoming session counts |
| `AcademyStudentsPage` | Search filter + staggered list |

## API
- `GET /api/academy/students` → `AcademyStudentsData` (students array + kpis)
