# Scenarios Feature (Teacher)

Manages speaking-practice scenarios for individual students.

## Components

- **StudentScenariosTab** — root tab: panel toggle between Scenarios list + Recordings
- **ScenarioList** — list of assigned scenarios with "New Scenario" button
- **ScenarioRow** — single row: title, date, status badge, keyword chips, recording count, delete
- **ScenarioCreateDrawer** — create form with title, date, publish time, status, keywords, prompts

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/teacher/student-scenarios.php?student_id=X` | List scenarios for student |
| POST | `/api/teacher/create-scenario.php` | Create scenario |
| POST | `/api/teacher/scenario-delete.php` | Delete scenario (cascades recordings + keywords) |
| GET | `/api/teacher/student-conversations.php?student_id=X` | List recordings |

## Notes

- `publish_at` is computed by backend from `sc_date + publish_time`
- `effective_status` adds `scheduled` when `publish_at > NOW()`
- Delete cascades audio files from disk → `scenario_recordings` → `scenario_keywords` → `scenarios`
