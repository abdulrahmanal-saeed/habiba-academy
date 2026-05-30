# Level Test Feature

Free placement test for new students. 6-step wizard to determine Arabic proficiency level (A1–C2).

## Steps

| # | Step | Description |
|---|------|-------------|
| 1 | Registration | Collect name, WhatsApp, email, age, country |
| 2 | Listening | MCQ questions with audio player, per block |
| 3 | Reading | MCQ questions with Arabic passage, per block |
| 4 | Writing | Two free-text tasks (task 1 fixed, task 2 level-dependent) |
| 5 | Speaking | 4 audio recordings via MediaRecorder API |
| 6 | Result | Show estimated level + pending teacher review notice |

## Structure

```
level-test/
├── types.ts                         — All TypeScript interfaces
├── api.ts                           — registerForTest, getLevelTestData, submitLevelTest
├── LevelTestPage.tsx                — Wizard orchestrator + AnimatePresence transitions
├── README.md
├── hooks/
│   └── useLevelTest.ts              — Wizard state machine (step, answers, recordings)
└── components/
    ├── StepIndicator.tsx            — Sticky top progress bar (6 steps)
    ├── RegistrationStep.tsx         — react-hook-form registration form
    ├── McqBlock.tsx                 — Reusable MCQ question + radio-button options
    ├── ListeningStep.tsx            — Block navigator + audio player + MCQ
    ├── ReadingStep.tsx              — Block navigator + passage + MCQ
    ├── WritingStep.tsx              — Two textarea tasks + word counter
    ├── AudioRecorder.tsx            — MediaRecorder widget (record → play → re-record)
    ├── SpeakingStep.tsx             — 4 × AudioRecorder + submit button
    └── ResultStep.tsx               — CEFR level badge + teacher review notice
```

## API Endpoints Required

```
POST /api/leveltest/start
  Body (FormData): full_name*, whatsapp*, email?, age?, country?
  Response: { ok: true }

GET /api/leveltest/questions                    ← needs backend implementation
  Response: { ok: true, listeningBlocks, readingBlocks, writingTask1, writingTask2, speakingPrompts }

POST /api/leveltest/submit
  Body (FormData): listening_answers (JSON), reading_answers (JSON),
                   writing_task1, writing_task2,
                   speaking_1..speaking_4 (audio/webm blobs)
  Response: { ok: true, estimatedLevel: string, score: number }
```

> **Note:** `GET /api/leveltest/questions` is a new endpoint needed for the React frontend.
> The existing `start.php` only saves session data. Create `backend/api/leveltest/questions.php`
> that returns blocks from `lt_questions` / `lt_blocks` tables + prompts from `lt_bank`.

## Known Constraints

- MediaRecorder requires HTTPS or localhost (browser security)
- Audio files are webm format; backend accepts webm/ogg/wav/mp3/m4a
- Teacher manually scores Writing (40 pts) + Speaking (20 pts) after submission
- Estimated level from MCQ auto-score is provisional until teacher review
