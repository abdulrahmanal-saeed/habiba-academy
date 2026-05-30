# Homework Stepper — Sprint 4.2

Dynamic multi-step homework submission flow for authenticated students.

## Route

```
/student/homework/:id
```

Missing or invalid `id` → redirects to `/student`.
Already-submitted homework → shows `<AlreadySubmitted />` static screen only.

## Steps (dynamic — only shown when content exists)

| Step | Condition | Duration estimate |
|---|---|---|
| `listening` | `mediaUrl !== null` | 3 min |
| `reading` | `readingText !== null` | 5 min |
| `mcq` | `mcqQuestions.length > 0` | max(3, ceil(count × 1.5)) |
| `writing` | `writingQuestions.length > 0` | count × 5 min |
| `speaking` | `speakingQuestions.length > 0` | max(2, ceil(totalSecs / 60)) |
| `submit` | always | 1 min |

## localStorage persistence

Key: `hw_prog_{studentId}_{homeworkId}`

Saves: `{ mcq: Record<qid, answer>, writing: Record<qid, text>, step: number }`

**Speaking blobs are NOT saved** (Blob cannot serialize to JSON).

Progress is:
- **Loaded** on first render after homework data arrives
- **Saved** on every MCQ answer change + writing textarea blur + step navigation
- **Cleared** on successful submit

When progress is restored, `<ResumeBanner />` is shown and dismissed by the user.

## Submit flow

1. `POST /api/student/submit-homework.php` with FormData (MCQ + writing + speaking blobs)
2. On success: `localStorage.removeItem(lsKey)` + `localStorage.setItem('book_pending_popup', 'homework')`
3. Navigate to `/student/homework/:id/result`

## Media detection (ListeningStep)

| Pattern | Renderer |
|---|---|
| `youtube.com` or `youtu.be` in URL | `<iframe>` (16:9 ratio) |
| `.mp3 / .ogg / .wav / .m4a` extension | `<audio controls>` |
| Anything else | `<video controls>` |

## MediaRecorder (SpeakingStep)

- MIME priority: `audio/webm` → `audio/mp4` (fallback)
- Auto-stop when countdown reaches 0
- Re-record: revokes old blob URL, starts fresh
- Each question has independent recording state (local component state)
- Blobs stored in `useHomeworkStore` (`speakingBlobs` map)

## Files

| File | Purpose |
|---|---|
| `types.ts` | StepType, MCQQuestion, WritingQuestion, SpeakingQuestion, Homework, SubmitResult |
| `api.ts` | getHomework (GET), submitHomework (POST FormData) |
| `homework.store.ts` | Zustand store — step, mcqAnswers, writingAnswers, speakingBlobs, progress save/load/clear |
| `components/StepIndicator.tsx` | Step circles with labels + duration estimates |
| `components/ListeningStep.tsx` | YouTube / audio / video renderer |
| `components/ReadingStep.tsx` | Pre-formatted reading passage |
| `components/MCQStep.tsx` | Radio option cards, saves to store on each change |
| `components/WritingStep.tsx` | Textareas with prompt, saves on blur |
| `components/SpeakingStep.tsx` | MediaRecorder per question, countdown timer |
| `components/SubmitStep.tsx` | Completion summary + submit button |
| `components/AlreadySubmitted.tsx` | Static "already submitted" screen |
| `components/ResumeBanner.tsx` | Dismissible "progress restored" alert |
| `HomeworkPage.tsx` | Orchestrator: fetches, routes steps, handles submit |
