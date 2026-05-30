import { useQueries } from '@tanstack/react-query'
import { STALE } from '@/core/lib/queryClient'
import {
  fetchNotifications,
  fetchSubmissions,
  fetchConversations,
  fetchAchievements,
  fetchWeeklySummary,
  fetchWeakWords,
  fetchMistakes,
  fetchMaterials,
} from '../api'
import type {
  NotificationsData,
  Submission,
  Conversation,
  Achievement,
  WeeklySummary,
  WeakWord,
  Mistake,
  Material,
  PrimaryCardState,
  ScoreCardState,
} from '../types'

export function derivePrimaryCardState(
  hw: NotificationsData['latestHomework'],
  review: NotificationsData['latestReview'],
  scenario: NotificationsData['latestScenario'],
): PrimaryCardState {
  // PHP: showReview = !!(review && (!review.isSubmitted || review.reviewStatus === 'reviewed' || !hw))
  const showReview = !!(review && (!review.isSubmitted || review.reviewStatus === 'reviewed' || !hw))

  if (showReview && review) {
    if (review.reviewStatus === 'reviewed')
      return { kind: 'review_reviewed', reviewId: review.id, homeworkTitle: review.homeworkTitle }
    if (review.reviewStatus === 'under_review')
      return { kind: 'review_under_review', reviewId: review.id, homeworkTitle: review.homeworkTitle }
    return { kind: 'review_pending', reviewId: review.id, homeworkTitle: review.homeworkTitle }
  }

  if (hw) {
    if (hw.isOverdue && !hw.isSubmitted)
      return { kind: 'homework_overdue', homeworkId: hw.id, title: hw.title, dueDate: hw.dueDate }
    if (!hw.isSubmitted)
      return { kind: 'homework_ready', homeworkId: hw.id, title: hw.title, dueDate: hw.dueDate }
    if (hw.isSubmitted)
      return { kind: 'homework_submitted', homeworkId: hw.id, title: hw.title }
  }

  if (scenario && !hw)
    return { kind: 'scenario', scenarioId: scenario.id, title: scenario.title }

  return { kind: 'empty' }
}

export function deriveScoreCardState(
  hw: NotificationsData['latestHomework'],
  review: NotificationsData['latestReview'],
  scenario: NotificationsData['latestScenario'],
  todaySubmission: NotificationsData['todaySubmission'],
): ScoreCardState {
  if (review?.reviewStatus === 'reviewed')
    return { kind: 'score', score: todaySubmission?.score ?? 0, total: todaySubmission?.total ?? 0, label: 'نتيجة المراجعة' }
  if (review?.isSubmitted)
    return { kind: 'under_review', label: 'قيد المراجعة' }
  if (todaySubmission && todaySubmission.total > 0)
    return { kind: 'score', score: todaySubmission.score, total: todaySubmission.total, label: 'نتيجة اليوم' }
  if (review && !review.isSubmitted)
    return { kind: 'review_ready', label: 'المراجعة جاهزة' }
  if (hw && !hw.isSubmitted)
    return { kind: 'homework_ready', label: 'الواجب جاهز' }
  if (scenario && !scenario.isRecorded)
    return { kind: 'scenario_ready', label: 'المحادثة جاهزة' }
  return { kind: 'empty', label: '—' }
}

const OPT = { staleTime: STALE.dashboard } as const

export function useStudentDashboard() {
  const results = useQueries({
    queries: [
      { queryKey: ['student', 'notifications'], queryFn: fetchNotifications, ...OPT },
      { queryKey: ['student', 'submissions'],   queryFn: fetchSubmissions,   ...OPT },
      { queryKey: ['student', 'conversations'], queryFn: fetchConversations, ...OPT },
      { queryKey: ['student', 'achievements'],  queryFn: fetchAchievements,  ...OPT },
      { queryKey: ['student', 'weekly-summary'],queryFn: fetchWeeklySummary, ...OPT },
      { queryKey: ['student', 'weak-words'],    queryFn: fetchWeakWords,     ...OPT },
      { queryKey: ['student', 'mistakes'],      queryFn: fetchMistakes,      ...OPT },
      { queryKey: ['student', 'materials'],     queryFn: fetchMaterials,     ...OPT },
    ],
  })

  const [notifQ, subsQ, convsQ, achQ, weekQ, weakQ, mistQ, matsQ] = results

  const isLoading = results.some((r) => r.isLoading)
  const isError   = results.some((r) => r.isError)

  const notif = notifQ.data as NotificationsData | undefined

  const primaryCard: PrimaryCardState = notif
    ? derivePrimaryCardState(notif.latestHomework, notif.latestReview, notif.latestScenario)
    : { kind: 'empty' }

  const scoreCard: ScoreCardState = notif
    ? deriveScoreCardState(notif.latestHomework, notif.latestReview, notif.latestScenario, notif.todaySubmission)
    : { kind: 'empty', label: '—' }

  const isNewStudent =
    notif !== undefined &&
    notif.latestHomework === null &&
    notif.latestReview === null &&
    notif.latestScenario === null

  return {
    isLoading,
    isError,
    notifications:   notif,
    submissions:     (subsQ.data as Submission[] | undefined) ?? [],
    conversations:   (convsQ.data as Conversation[] | undefined) ?? [],
    achievements:    (achQ.data as Achievement[] | undefined) ?? [],
    weeklySummary:   weekQ.data as WeeklySummary | undefined,
    weakWords:       (weakQ.data as WeakWord[] | undefined) ?? [],
    mistakes:        (mistQ.data as Mistake[] | undefined) ?? [],
    materials:       (matsQ.data as Material[] | undefined) ?? [],
    primaryCard,
    scoreCard,
    isNewStudent,
  }
}
