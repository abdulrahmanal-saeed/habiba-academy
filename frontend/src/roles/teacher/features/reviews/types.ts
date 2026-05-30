export type ReviewType = 'weekly_review' | 'monthly_review'
export type ReviewStatus = 'draft' | 'published' | 'closed'
export type EffectiveReviewStatus = 'draft' | 'scheduled' | 'published' | 'closed'
export type SubmissionStatus = 'pending' | 'reviewed'
export type TeacherVerdict = 'correct' | 'wrong'
export type SectionId = 'mcq' | 'matching' | 'fill_the_blank' | 'writing' | 'speaking' | 'scenario'
export type GradingMode = 'auto' | 'manual'

export interface ReviewListItem {
  id: number
  title: string
  review_type: ReviewType
  review_date: string
  status: ReviewStatus
  total_points: number
  submission_id: number | null
  auto_score: number | null
  manual_score: number | null
  total_score: number | null
  review_status: SubmissionStatus | null
  submitted_at: string | null
}

export interface ManualScoreRow {
  section_id: string
  item_id: string
  max_points: number
  score: number
  teacher_verdict: TeacherVerdict | null
  feedback: string
}

export interface SectionOverrideRow {
  section_id: string
  grading_mode: GradingMode
}

export interface ReviewCreatePayload {
  student_id: number
  review_type: ReviewType
  title?: string
  review_date: string
  publish_time?: string
  status: ReviewStatus
  schema_json: string
}

export interface ReviewUpdatePayload extends ReviewCreatePayload {
  review_id: number
}

export interface ReviewGradePayload {
  submission_id: number
  teacher_note?: string
  scores_json: string
  overrides_json: string
}

// Schema types
export interface MCQQuestion {
  id: string
  question: string
  options: { A: string; B: string; C?: string; D?: string }
  correct: 'A' | 'B' | 'C' | 'D'
  points: number
}

export interface MatchingExercise {
  id: string
  title: string
  left_column: { id: string; text: string }[]
  right_column: { id: string; text: string }[]
  correct_pairs: Record<string, string>
}

export interface FillBlankQuestion {
  id: string
  sentence_with_blank: string
  correct_answers: string[]
  points: number
}

export interface WritingQuestion {
  id: string
  prompt: string
  points: number
  sample_answer?: string
  grading_criteria: string[]
}

export interface SpeakingQuestion {
  id: string
  prompt: string
  points: number
  sample_answer?: string
  grading_criteria: string[]
}

export interface ScenarioItem {
  id: string
  title: string
  points: number
  expected_steps: { student_task: string; points: number }[]
}

export interface ReviewSection {
  section_id: SectionId
  title: string
  auto_gradable: boolean
  total_points: number
  points_per_question?: number
  points_per_match?: number
  questions?: (MCQQuestion | FillBlankQuestion | WritingQuestion | SpeakingQuestion)[]
  exercises?: MatchingExercise[]
  scenarios?: ScenarioItem[]
}

export interface ReviewSchema {
  meta: { title_en?: string; title?: string }
  sections: ReviewSection[]
}

export interface SubmissionDetail {
  id: number
  review_id: number
  student_id: number
  answers_json: string
  auto_score: number | null
  manual_score: number | null
  total_score: number | null
  teacher_note: string | null
  review_status: SubmissionStatus
  submitted_at: string | null
  reviewed_at: string | null
}

export interface ReviewDetail {
  title: string
  review_type: ReviewType
  total_points: number
  schema_json: string
}

export interface ReviewSubmissionPayload {
  submission: SubmissionDetail
  review: ReviewDetail
  manual_scores: ManualScoreRow[]
  section_overrides: SectionOverrideRow[]
}
