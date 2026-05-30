# Level Test Feature (Teacher)

Manages the placement test: grading attempts, question bank editing, and prompt bank.

## Routes

`/teacher/level-test` → `<LevelTestPage />`

## Tabs

1. **Attempts** — list all submissions with filter (pending/reviewed/all), CSV export, grade drawer
2. **Question Bank** — listening + reading blocks, per-slot variants editor
3. **Prompts** — writing task bank + speaking phase bank

## Score System

| Skill | Max | Graded By |
|-------|-----|-----------|
| Listening | 30 | Auto |
| Reading | 25 | Auto |
| Writing | 40 | Teacher |
| Speaking | 80 | Teacher |
| **Total** | **175** | |

Level formula: `pct = total/175*100` → A2 <40%, B1 <55%, B2 <70%, C1 <85%, C2 ≥85%

## Key Constraints

- CSV export: `window.open('/api/teacher/export-leveltest.php')` — NOT JSON
- Media upload: CSRF token in POST body field `csrf_token` (not header)
- `questions` in quick-block-save: sent as `JSON.stringify(array)`
- `student_id` may be null for leads — no student level update in that case
