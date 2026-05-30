# Student Progress Feature

Displays a student's learning journey: CEFR level, stat chips, MCQ score history chart, and achievements.

## Role
Student only.

## Components
- `LevelHero` — CEFR level badge with name + session count
- `CefrBar` — 6-step A1→C2 progress bar (done/current/future states)
- `StatsRow` — hw_count, avg_pct, sc_count, streak, sess_count (omitted if 0)
- `ScoreChart` — CSS bar chart of last 10 MCQ homeworks, hidden if empty
- `AchievementGrid` — earned achievements + locked "coming up" preview

## API Endpoints
- `GET /api/student/progress.php` — returns all stats computed server-side

## Key Business Rules
- `avg_pct` is `null` (not 0) when no homeworks — displayed as `—`
- `sess_count === 0` → sessions chip omitted
- `streak === 0` → shows 0 (no fire emoji)
- Score bar colors: ≥80% = success, ≥50% = warning, else = danger
- CEFR_META colors are CEFR-standard data colors, not brand colors (Rule 3 exception)
- 10 achievements total, server computes earned subset

## Known Limitations
- No refresh button (page reload needed for latest stats)
