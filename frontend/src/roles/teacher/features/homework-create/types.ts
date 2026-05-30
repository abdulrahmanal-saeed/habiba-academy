export interface MCQQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c?: string
  option_d?: string
  correct_option: 'a' | 'b' | 'c' | 'd'
}

export interface WritingQuestion {
  prompt: string
  min_sentences: number
  focus_area?: string
}

export interface SpeakingQuestion {
  prompt: string
  time_limit: number
  tips?: string
}

export interface HomeworkPayload {
  student_id: number
  title: string
  hw_date: string
  publish_time?: string
  status: 'draft' | 'published' | 'closed'
  media_url?: string
  media_instructions?: string
  reading_text?: string
  mcq_questions: MCQQuestion[]
  writing_questions: WritingQuestion[]
  speaking_questions: SpeakingQuestion[]
}

export interface HomeworkCreatedResponse {
  homework_id: number
  title: string
  publish_at: string | null
  effective_status: string
}
