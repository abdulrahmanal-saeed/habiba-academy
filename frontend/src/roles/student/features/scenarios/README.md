# Scenarios Feature — Student Role

## What does this feature do?
Lets students view and record spoken responses for speaking scenarios assigned by their teacher. Each scenario has a situation (context), a mission prompt, vocabulary keywords, and a time-limited audio recorder. Students can re-record multiple takes; the teacher reviews recordings and leaves feedback chips and notes. A model answer unlocks after the first submission.

## Roles
- **Consumer:** Student (record + view feedback)
- **Owner / Creator:** Teacher (creates scenarios, leaves feedback)

## Main Components
| File | Purpose |
|------|---------|
| `ScenariosPage.tsx` | List of all assigned scenarios, split into Today / Previous |
| `ScenarioDetailPage.tsx` | Detail view: context, recorder, past takes, model answer |
| `components/ScenarioCard.tsx` | List-item card with take count, Today/New badges |
| `components/RecordingSection.tsx` | MediaRecorder + countdown timer + submit flow |
| `components/ConfidenceRating.tsx` | Post-submit self-rating widget (persists to localStorage) |
| `components/PreviousRecordings.tsx` | Past takes with audio player, chips, teacher note |
| `components/ModelAnswerAccordion.tsx` | Collapsible model answer (RTL text, shown after first submit) |

## API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/student/scenarios.php` | List all published scenarios |
| GET | `/api/student/scenario-detail.php?scenario_id=X` | Scenario detail + recordings |
| POST | `/api/student/submit-scenario.php` | Submit audio recording (FormData) |

## Key Behaviours
- **Confidence rating:** Stored in `localStorage` as `sc_rate_{scenarioId}_{takeNo}` (1/2/3). Never sent to server — display-only badge on past takes.
- **Model answer:** Only shown after `recordings.length > 0`.
- **RecordingSection key:** Keyed by `next_take` so it resets to idle state after each successful submission without unmounting the parent page.
- **Audio format:** `audio/webm` preferred; falls back to `audio/mp4` on iOS Safari.

## Known Limitations / TODOs
- No offline support — recording requires active network for submit.
- Confidence ratings are localStorage-only; not synced to the server.
