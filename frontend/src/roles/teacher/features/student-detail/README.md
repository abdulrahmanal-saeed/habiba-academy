# Student Detail Feature

Teacher view of a single student's profile, stats, and work history.

## Routes
- `/teacher/students/:id` → `StudentDetailPage`

## Tabs
1. **Overview** — Quick add: weak words + common mistakes
2. **Submissions** — All homework, reviews, scenarios; delete homework with confirm
3. **Weak Words** — Lazy-loaded list; mastered words shown dimmed
4. **Mistakes** — Tag chips with mastery state; lazy-loaded
5. **Scenarios** — Recording cards with `<audio>` player
6. **Materials** — Assigned materials table (read-only)
7. **Schedule** — 7-slot weekly schedule (0=Sat, 6=Fri); upsert per day; Generate Month Sessions

## API Endpoints
- GET `/api/teacher/student-detail.php?student_id=X` — stats + profile (NEW)
- GET `/api/teacher/student-submissions.php?student_id=X`
- GET/POST `/api/teacher/student-schedule.php`
- GET `/api/teacher/student-weak-words.php?student_id=X`
- POST `/api/teacher/save-weak-words.php`
- GET `/api/teacher/student-mistakes.php?student_id=X`
- POST `/api/teacher/save-mistakes.php`
- GET `/api/teacher/student-conversations.php?student_id=X`
- GET `/api/teacher/student-materials.php?student_id=X`
- POST `/api/teacher/generate-month-sessions.php`
- GET `/api/teacher/ai/analyze-student.php?student_id=X`

## Key Rules
- Day of week: 0=Saturday (NOT Sunday) — different from JS Date.getDay()
- Schedule GET returns only saved rows — fill missing 7 slots with defaults client-side
- Delete homework: irreversible, removes audio files on disk — confirm required
- Avg score 0 is ambiguous when submitted_count === 0 — show "—" in that case
