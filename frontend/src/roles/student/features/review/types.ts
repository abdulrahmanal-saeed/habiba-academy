export type SectionId =
  | 'mcq'
  | 'matching'
  | 'fill_the_blank'
  | 'writing'
  | 'speaking'
  | 'scenario'
  | 'emirati_dialect'

export interface MCQQuestion {
  id: string
  question: string
  options: Record<string, string>
  correct?: string
  points?: number
  hint?: string
}

export interface MCQSection {
  section_id: 'mcq'
  title?: string
  instructions?: string
  auto_gradable: true
  total_points: number
  points_per_question?: number
  reading_text?: string
  questions: MCQQuestion[]
}

export interface MatchingItem {
  id: string
  label: string
}

export interface MatchingExercise {
  id: string
  title?: string
  left_column: MatchingItem[]
  right_column: MatchingItem[]
  correct_pairs?: Record<string, string>
}

export interface MatchingSection {
  section_id: 'matching'
  title?: string
  instructions?: string
  auto_gradable: true
  total_points: number
  points_per_match?: number
  exercises: MatchingExercise[]
}

export interface FillBlankQuestion {
  id: string
  sentence_with_blank?: string
  prompt?: string
  question?: string
  english_hint?: string
  image_hint_url?: string
  image_hint_alt?: string
  correct_answers?: string[]
  points?: number
}

export interface FillTheBlankSection {
  section_id: 'fill_the_blank'
  title?: string
  instructions?: string
  auto_gradable: true
  total_points: number
  questions: FillBlankQuestion[]
}

export interface WritingQuestion {
  id: string
  prompt: string
  points?: number
}

export interface WritingSection {
  section_id: 'writing'
  title?: string
  instructions?: string
  auto_gradable: false
  total_points: number
  questions: WritingQuestion[]
}

export interface SpeakingQuestion {
  id: string
  prompt: string
  time_limit_seconds: number
  points?: number
}

export interface SpeakingSection {
  section_id: 'speaking'
  title?: string
  instructions?: string
  auto_gradable: false
  total_points: number
  questions: SpeakingQuestion[]
}

export interface ScenarioStep {
  student_task: string
  points: number
}

export interface ScenarioItem {
  id: string
  title: string
  context?: string
  expected_steps?: ScenarioStep[]
  time_limit_seconds: number
  points?: number
}

export interface ScenarioSection {
  section_id: 'scenario'
  title?: string
  instructions?: string
  auto_gradable: false
  total_points: number
  scenarios: ScenarioItem[]
}

export interface EmiratialDialectQuestion {
  id: string
  word?: string
  question?: string
  correct_meaning?: string
}

export interface EmiratialDialectSection {
  section_id: 'emirati_dialect'
  title?: string
  instructions?: string
  auto_gradable: false
  total_points: number
  questions: EmiratialDialectQuestion[]
}

export type ReviewSection =
  | MCQSection
  | MatchingSection
  | FillTheBlankSection
  | WritingSection
  | SpeakingSection
  | ScenarioSection
  | EmiratialDialectSection

export interface Review {
  id: number
  title: string
  reviewType: 'weekly_review' | 'monthly_review'
  reviewDate: string
  sections: ReviewSection[]
}

export interface AnswersMap {
  mcq: Record<string, string>
  matching: Record<string, Record<string, string>>
  fill_the_blank: Record<string, string>
  writing: Record<string, string>
  speaking: Record<string, string>
  scenario: Record<string, string>
  diagnostic?: {
    emirati_dialect?: Record<string, { known: string; meaning: string }>
  }
}

export interface MCQBreakdownItem {
  given: string
  correct: string
  points: number
  earned: number
  is_correct: boolean
}

export interface MatchingBreakdownItem {
  given: string
  correct: string
  earned: number
  is_correct: boolean
}

export interface MatchingBreakdownExercise {
  earned: number
  items: Record<string, MatchingBreakdownItem>
}

export interface FillBlankBreakdownItem {
  given: string
  correct_answers: string[]
  points: number
  earned: number
  is_correct: boolean
}

export interface AutoBreakdownMap {
  mcq?: Record<string, MCQBreakdownItem>
  matching?: Record<string, MatchingBreakdownExercise>
  fill_the_blank?: Record<string, FillBlankBreakdownItem>
}

export interface ManualScoreEntry {
  section_id: string
  item_id: string
  score: number
  max_points: number
  teacher_verdict: 'correct' | 'wrong' | null
  feedback: string | null
}

export interface ReviewResult {
  id: number
  title: string
  reviewType: 'weekly_review' | 'monthly_review'
  reviewDate: string
  submittedAt: string
  reviewStatus: 'pending' | 'reviewed'
  schema: { sections: ReviewSection[] }
  effectiveAutoScore: number | null
  manualScore: number | null
  totalScore: number | null
  totalPoints: number | null
  teacherNote: string | null
  answers: AnswersMap | null
  autoBreakdown: AutoBreakdownMap | null
  manualScores: Record<string, ManualScoreEntry>
  sectionOverrides: Record<string, 'auto' | 'manual'>
}

export interface SubmitReviewResult {
  review_id: number
  submission_id: number
  auto_score: number
}
