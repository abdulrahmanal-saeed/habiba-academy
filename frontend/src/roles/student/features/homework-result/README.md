# Homework Result — Sprint 4.3

Read-only result page for a submitted (or pending) homework assignment.

## Route

```
/student/homework/:id/result
```

Missing or invalid `id` → redirects to `/student`.

**No "must be submitted" guard.** The page renders even when `isSubmitted = false`, showing a "لم يُسلَّم بعد" badge with empty answer sections (matches PHP behaviour).

## API

`GET /api/student/homework-result.php?homework_id=X`

Returns `HomeworkResult` — ownership verified server-side (homework must belong to the authenticated student).

## MCQ option coloring (exact PHP logic)

| State | Condition | Style |
|---|---|---|
| `correct-chosen` | `chosen === correct` | `--success-bg` fill, green border, "إجابتك ✓" |
| `correct-unchosen` | `correct && !chosen` | `--success-bg` fill, green border, "← الإجابة الصحيحة" |
| `wrong-chosen` | `chosen && !correct` | `--danger-bg` fill, red border, "إجابتك ✗" |
| `neutral` | neither | transparent, `--border` |

- `correctOption` and `chosenOption` are lowercase `'a'|'b'|'c'|'d'`
- `chosenOption` is `null` when the question was not answered
- Question card border is `--success` / `--danger` based on `isCorrect`

## Book popup logic

Fires once after homework submit. Triggered when ALL:
1. `bookPopup.allowed === true` (PHP: offer exists + student has no access + launch active + popup enabled)
2. `localStorage.getItem('book_pending_popup') === 'homework'` (set by HomeworkPage on submit)
3. 3-day suppression not active (`book_homework_popup_until` LS key)

On trigger:
- Removes `book_pending_popup`
- Sets `book_homework_popup_until = now + 3 days`
- Fires analytics `POST /api/book-marketing-event.php { event_key: 'book_popup_homework_last_shown' }`
- Shows modal after **700ms** delay

Note: 3-day suppression (not 7-day — `BookBanner` on the dashboard uses 7-day).

## Files

| File | Purpose |
|---|---|
| `types.ts` | MCQOption, MCQOptionState, MCQResult, WritingResult, SpeakingResult, BookPopupConfig, HomeworkResult |
| `api.ts` | getHomeworkResult; re-exports bookMarketingEvent from dashboard/api |
| `components/ResultHeader.tsx` | Status badge + score fraction + animated progress bar + teacher note |
| `components/MCQResultCard.tsx` | Per-question accordion with 4-option color coding |
| `components/WritingResultCard.tsx` | Prompt + pre-wrap answer (or placeholder) |
| `components/SpeakingResultCard.tsx` | Prompt + `<audio controls>`; normalizes missing leading `/` |
| `components/ReadingAccordion.tsx` | Collapsible reading reference, collapsed by default |
| `components/BookPopupModal.tsx` | Modal with 700ms delay, 3-day LS suppression |
| `HomeworkResultPage.tsx` | Orchestrator — useQuery, conditional sections, BookPopupModal |
| `index.tsx` | Barrel export |
