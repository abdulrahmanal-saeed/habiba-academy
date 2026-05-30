# Academy Partner Role

## Overview
Portal for partner academies that refer students to Habiba Nabil. Academies log in with an access code, view their linked students, submit student briefs to the teacher, and receive notifications on brief status changes.

## Auth
- Login via `access_code` field in `academies` table
- Session: `$_SESSION['academy_id']`
- All API endpoints call `portals_ensure_schema($pdo)` on every request

## Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/academy` | `AcademyDashboardPage` | KPIs + student list snapshot |
| `/academy/students` | `AcademyStudentsPage` | Full student list + search |
| `/academy/briefs` | `BriefsPage` | All submitted briefs |
| `/academy/briefs/new` | `NewBriefPage` | Submit a new brief |
| `/academy/briefs/:id` | `BriefDetailPage` | Read-only brief detail |
| `/academy/notifications` | `AcademyNotificationsPage` | Notifications from teacher |

## Features
| Feature | Path |
|---------|------|
| Dashboard | `features/dashboard/` |
| Students | `features/students/` |
| Briefs | `features/briefs/` |
| Notifications | `features/notifications/` |

## Backend
| Endpoint | File |
|----------|------|
| `GET /api/academy/home` | `backend/api/academy/home.php` |
| `GET /api/academy/students` | `backend/api/academy/students.php` |
| `GET/POST /api/academy/briefs` | `backend/api/academy/briefs.php` |
| `GET/POST /api/academy/notifications` | `backend/api/academy/notifications.php` |

## Key Patterns
- `ensure_student_brief_tables($pdo)` before any brief query
- `student_brief_validate($input, 'academy')` for form validation
- `platform_notify($pdo, [...])` to alert teacher on brief submit
- Framer Motion stagger on all lists and grids
