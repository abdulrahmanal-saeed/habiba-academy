# Review — Sprint 4.4

Read and submit student review/test assignments.

## Routes

```
/student/review/:id         — take page (submit answers)
/student/review/:id/result  — result page (read-only)
```

Both routes require the student to own the review (`student_id` checked server-side).

**Already submitted on take page:** API returns error `'Review already submitted.'` → navigate to result.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/student/review.php?review_id=X` | Fetch schema for take page (correct answers stripped) |
| POST | `/api/review/submit.php` | Submit FormData with answers + audio blobs |
| GET | `/api/student/review-result.php?review_id=X` | Fetch full result; marks notification read |

## Section Types

| `section_id` | Auto-gradable | Take form | Result |
|---|---|---|---|
| `mcq` | ✓ | Radio-like buttons | Per-question badge + correct answer |
| `matching` | ✓ | Left/right selects | Per-pair badge |
| `fill_the_blank` | ✓ | Text inputs | Filled sentence |
| `writing` | ✗ | Textareas | Pre-wrap text + manual score |
| `speaking` | ✗ | MediaRecorder | Audio player + manual score |
| `scenario` | ✗ | MediaRecorder + expected steps | Audio player + manual score |
| `emirati_dialect` | ✗ | Not shown | Diagnostic display only |

## Form Data Keys (POST /api/review/submit.php)

```
review_id: number
mcq[qid]: 'A' | 'B' | 'C' | 'D'
matching[exerciseId][leftId]: rightId
fill_the_blank[qid]: string
writing[qid]: string
speaking__qid: Blob  ← double underscore
scenario__qid: Blob  ← double underscore
```

## Result States

- `reviewStatus === 'pending'` → Hourglass "قيد المراجعة" screen; no breakdown
- `reviewStatus === 'reviewed'` → Score summary (auto/manual/total) + per-section breakdown

## Grading Logic

- Auto sections: scores from `auto_breakdown_json` on submit
- Manual sections: scores from `student_review_manual_scores` (teacher-entered)
- Section overrides: teacher can flip auto section to manual via `student_review_section_overrides`
- `ManualScoreEntry` keyed `'section_id::item_id'`; verdict `'correct'` → full points, `'wrong'` → 0

## localStorage

Key: `rev_prog_{studentId}_{reviewId}`  
Persists: `mcq`, `matching`, `fill`, `writing` answers.  
**NOT persisted:** audio blobs (in-memory only).

## Files

| File | Purpose |
|---|---|
| `types.ts` | All TypeScript interfaces for sections, answers, result |
| `api.ts` | getReview, getReviewResult, submitReview (postForm) |
| `review.store.ts` | Zustand store with localStorage persistence |
| `components/MCQSectionCard.tsx` | Radio-like option button cards |
| `components/MatchingSectionCard.tsx` | Left/right select dropdowns |
| `components/FillBlankSectionCard.tsx` | Text inputs + optional image hint |
| `components/WritingSectionCard.tsx` | Textareas per question |
| `components/SpeakingSectionCard.tsx` | MediaRecorder per speaking question |
| `components/ScenarioSectionCard.tsx` | MediaRecorder + expected steps per scenario |
| `components/ReviewResultHeader.tsx` | Pending or score summary header |
| `components/MCQResultSection.tsx` | Per-question MCQ result with badge |
| `components/MatchingResultSection.tsx` | Per-pair matching result |
| `components/FillBlankResultSection.tsx` | Filled sentence result |
| `components/ManualResultSection.tsx` | Shared for writing/speaking/scenario |
| `ReviewPage.tsx` | Take form orchestrator |
| `ReviewResultPage.tsx` | Result orchestrator; emirati_dialect inline |
| `index.tsx` | Barrel export |
