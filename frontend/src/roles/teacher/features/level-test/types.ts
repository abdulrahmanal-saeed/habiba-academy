export type LevelTestReviewStatus = 'pending' | 'reviewed'
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type LTSection = 'listening' | 'reading'
export type WritingTaskType = 'task1' | 'task2'
export type SpeakingPhase = 'warmup' | 'description' | 'discussion' | 'abstract'

export interface LevelTestAttempt {
  id: number
  student_id: number | null
  full_name: string
  email: string
  whatsapp: string
  age: number | null
  country: string | null
  applicant_type: string
  test_type: string
  lead_status: string
  review_status: LevelTestReviewStatus
  listening_score: number | null
  reading_score: number | null
  writing_score: number | null
  speaking_score: number | null
  auto_score: number | null
  overall_estimated_level: string | null
  final_level: CEFRLevel | null
  teacher_notes: string | null
  created_at: string
  submitted_at: string | null
  reviewed_at: string | null
}

export interface LevelTestGradePayload {
  attempt_id: number
  writing_score: number
  speaking_score: number
  teacher_notes?: string
}

export interface LTQuestion {
  id: number
  block_id: number
  item_number: number
  variant: number
  question_ar: string
  question_en: string
  opt_a_ar: string
  opt_a_en: string
  opt_b_ar: string
  opt_b_en: string
  opt_c_ar: string
  opt_c_en: string
  opt_d_ar: string
  opt_d_en: string
  correct_opt: 'A' | 'B' | 'C' | 'D'
  is_active: boolean
}

export interface LTQuestionSlot {
  item_number: number
  variants: LTQuestion[]
}

export interface LTBlock {
  id: number
  section: LTSection
  block_number: number
  cefr_level: CEFRLevel
  audio_path: string
  passage_ar: string
  passage_en: string
  sort_order: number
  is_active: boolean
  slots: LTQuestionSlot[]
}

export interface LTBlockSavePayload {
  id: number
  section: LTSection
  cefr_level: CEFRLevel
  audio_path?: string
  passage_ar?: string
  passage_en?: string
}

export interface LTQuestionSavePayload {
  id: number
  block_id: number
  item_number: number
  question_ar: string
  question_en?: string
  opt_a_ar: string
  opt_a_en?: string
  opt_b_ar: string
  opt_b_en?: string
  opt_c_ar: string
  opt_c_en?: string
  opt_d_ar?: string
  opt_d_en?: string
  correct_opt: 'A' | 'B' | 'C' | 'D'
  is_active?: number
}

export interface WritingPrompt {
  id: number
  task_type: WritingTaskType
  cefr_level: CEFRLevel | 'ALL'
  title: string
  prompt_text: string
  diagnostic_notes: string
  word_range: string
  is_active: boolean
}

export interface SpeakingPrompt {
  id: number
  phase: SpeakingPhase
  target_level: string
  title: string
  prompt_text: string
  bullets: string[]
  image_path: string
  evaluation_notes: string
  sort_order: number
  is_active: boolean
}

export interface QuickBlock {
  id: number
  block_number: number
  passage_ar: string
  sort_order: number
  is_active: boolean
  questions: QuickQuestion[]
}

export interface QuickQuestion {
  id?: number
  question_ar: string
  opt_a: string
  opt_b: string
  opt_c?: string
  opt_d?: string
  correct_opt: 'A' | 'B' | 'C' | 'D'
}
