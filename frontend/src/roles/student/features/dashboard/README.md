# Student Dashboard — Sprint 4.1

Main dashboard for authenticated students. Fires 8 parallel API calls on mount and derives all UI state locally.

## Data flow

```
useStudentDashboard (useQueries × 8)
  ├── notifications.php  ← hub: name, streak, latest hw/review/scenario, today's submission, book banner
  ├── submissions.php
  ├── conversations.php
  ├── achievements.php
  ├── weekly-summary.php
  ├── weak-words.php
  ├── common-mistakes.php
  └── materials.php
```

All queries use `staleTime: STALE.dashboard` (30s).

## PrimaryCard state machine

Priority order (derived from PHP `updatePrimaryCard` logic):

```
showReview = !!(review && (!review.isSubmitted || review.reviewStatus === 'reviewed' || !hw))
```

1. `review_pending`      — Start/Submit Review (accent)
2. `review_reviewed`     — View Result (success)
3. `review_under_review` — Under Review (muted, dimmed)
4. `homework_overdue`    — Submit Now (danger)
5. `homework_ready`      — Start (accent)
6. `homework_submitted`  — View Result (muted, dimmed)
7. `scenario`            — Start Scenario (accent, only when hw=null)
8. `empty`               — WhatsApp CTA

## ScoreCard priority

1. Review reviewed → score / total
2. Review submitted but not reviewed → "قيد المراجعة"
3. Today's submission with total > 0 → score / total
4. Review pending → "المراجعة جاهزة"
5. HW pending → "الواجب جاهز"
6. Scenario not recorded → "المحادثة جاهزة"
7. Else → "—"

## Special states

- **WelcomeBanner** — shown when `latestHomework`, `latestReview`, and `latestScenario` are all null (brand new student)
- **WeeklySummaryStrip** — hidden when `hwDone === 0 && scDone === 0`
- **AchievementBadges** — silently omitted when `achievements.length === 0`, max 4 shown
- **BookBanner** — 7-day localStorage suppression (`habiba_book_banner_dismissed`); fires `POST /api/book-marketing-event.php` on dismiss

## Files

| File | Purpose |
|---|---|
| `types.ts` | All interfaces + PrimaryCardState/ScoreCardState discriminated unions |
| `api.ts` | 8 fetch functions + 3 mutation functions |
| `hooks/useStudentDashboard.ts` | `useQueries` orchestrator; `derivePrimaryCardState`, `deriveScoreCardState` |
| `components/PrimaryCard.tsx` | 8-state task card with action button |
| `components/ScoreCard.tsx` | Score/streak display with animated progress bar |
| `components/WeeklySummaryStrip.tsx` | 4-stat weekly summary strip |
| `components/AchievementBadges.tsx` | Up to 4 achievement icons |
| `components/WelcomeBanner.tsx` | New-student welcome with WhatsApp CTA |
| `components/BookBanner.tsx` | Dismissible book promo with 7-day suppression |
| `StudentDashboard.tsx` | Layout composition (no business logic) |
