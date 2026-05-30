export interface LatestHomework {
  id: number
  title: string
  isSubmitted: boolean
  isOverdue: boolean
  dueDate: string
}

export interface LatestReview {
  id: number
  homeworkTitle: string
  isSubmitted: boolean
  reviewStatus: 'pending' | 'under_review' | 'reviewed'
}

export interface LatestScenario {
  id: number
  title: string
  isRecorded: boolean
}

export interface TodaySubmission {
  id: number
  score: number
  total: number
}

export interface BookBannerInfo {
  title: string
  subtitle: string
  ctaUrl: string
  imageUrl: string | null
}

export interface NotificationsData {
  studentName: string
  streak: number
  latestHomework: LatestHomework | null
  latestReview: LatestReview | null
  latestScenario: LatestScenario | null
  todaySubmission: TodaySubmission | null
  bookBanner: BookBannerInfo | null
}

export interface Submission {
  id: number
  homeworkTitle: string
  score: number
  total: number
  submittedAt: string
}

export interface Conversation {
  id: number
  teacherName: string
  lastMessage: string
  lastMessageAt: string
  unread: boolean
}

export interface Achievement {
  id: number
  title: string
  description: string
  iconUrl: string | null
  earnedAt: string
}

export interface WeeklySummary {
  hwDone: number
  hwTotal: number
  scDone: number
  scTotal: number
  reviewsDone: number
  wordsLearned: number
}

export interface WeakWord {
  id: number
  word: string
  meaning: string
  isMastered: boolean
}

export interface Mistake {
  id: number
  category: string
  description: string
  isMastered: boolean
}

export interface Material {
  id: number
  title: string
  type: 'pdf' | 'video' | 'audio' | 'link'
  url: string
  uploadedAt: string
}

/* ── PrimaryCard discriminated union (derived from PHP updatePrimaryCard logic) ── */
export type PrimaryCardState =
  | { kind: 'review_pending'; reviewId: number; homeworkTitle: string }
  | { kind: 'review_reviewed'; reviewId: number; homeworkTitle: string }
  | { kind: 'review_under_review'; reviewId: number; homeworkTitle: string }
  | { kind: 'homework_overdue'; homeworkId: number; title: string; dueDate: string }
  | { kind: 'homework_ready'; homeworkId: number; title: string; dueDate: string }
  | { kind: 'homework_submitted'; homeworkId: number; title: string }
  | { kind: 'scenario'; scenarioId: number; title: string }
  | { kind: 'empty' }

/* ── ScoreCard 7-state priority ── */
export type ScoreCardState =
  | { kind: 'score'; score: number; total: number; label: string }
  | { kind: 'under_review'; label: string }
  | { kind: 'review_ready'; label: string }
  | { kind: 'homework_ready'; label: string }
  | { kind: 'scenario_ready'; label: string }
  | { kind: 'empty'; label: string }

export interface DashboardData {
  notifications: NotificationsData
  submissions: Submission[]
  conversations: Conversation[]
  achievements: Achievement[]
  weeklySummary: WeeklySummary
  weakWords: WeakWord[]
  mistakes: Mistake[]
  materials: Material[]
}
