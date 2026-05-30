export type AIErrorCode = 'NO_API_KEY' | 'AI_DISABLED' | 'AI_LIMIT_REACHED'

export interface AIGovernanceError {
  error: AIErrorCode
  message: string
}

export function isGovernanceError(v: unknown): v is AIGovernanceError {
  return typeof v === 'object' && v !== null && 'error' in v
}

export interface AIAnalysis {
  summary: string
  strengths: string[]
  weak_areas: string[]
  recommended_focus: string
  homework_recommendation: string
  scenario_recommendation: string
  status: 'on_track' | 'needs_review' | 'needs_support'
}

export interface AIHomeworkSection {
  included: boolean
  instructions?: string
  suggested_topic?: string
  text?: string
  questions?: Array<Record<string, string | number>>
}

export interface AIHomework {
  title: string
  listening: AIHomeworkSection
  reading: AIHomeworkSection
  mcq: AIHomeworkSection
  writing: AIHomeworkSection
  speaking: AIHomeworkSection
}

export interface AIScenario {
  title: string
  situation: string
  prompt: string
  time_limit_seconds: number
  keywords: string[]
  model_answer: string
}

export interface AILessonVocab {
  arabic: string
  transliteration: string
  meaning: string
  example_sentence: string
}

export interface AILessonActivity {
  duration_minutes?: number
  activity?: string
  teacher_instructions?: string
  description?: string
  student_instructions?: string
  example_prompts?: string[]
}

export interface AILesson {
  lesson_title: string
  lesson_objective: string
  level_note: string
  warm_up: AILessonActivity | null
  vocabulary: AILessonVocab[]
  guided_practice: AILessonActivity | null
  main_speaking_task: AILessonActivity | null
  feedback_correction: { focus_points: string[]; encouragement_tip: string } | null
  homework_suggestion: string
  slides_outline: Array<{ slide: number; title: string; content: string }>
}

export interface AISession {
  session_number: number
  title: string
  skills: string[]
  goals: string
}

export interface AIArticle {
  title: string
  english_title?: string
  slug: string
  seo_meta_title: string
  seo_meta_description: string
  excerpt: string
  body: string
  cta: string
  target_audience?: string
  keywords?: string[]
  suggested_internal_links?: string[]
  cover_image_prompt?: string
  status: 'draft'
}

export interface AIWritingAssist {
  summary: string
  possible_issues: string[]
  suggested_feedback: string
  suggested_correction: string
  suggested_tags: string[]
  confidence: number
}

export interface MistakeSuggestion {
  taxonomy_id: number
  code: string
  label_en: string
  label_ar: string
  confidence: number
  reason: string
}

export interface ReviewPriorityItem {
  student_id: number
  full_name: string
  priority_score: number
  reason: string
}

export interface SuggestionActionPayload {
  ai_request_id: number
  student_id: number
  feature_key: string
  action: 'accepted' | 'edited' | 'rejected'
  original_suggestion: string
  final_value: string
}

export interface MistakeEventPayload {
  student_id: number
  taxonomy_id: number
  source_type: string
  source_id?: number
  source_question_id?: string
  evidence_text: string
  teacher_note?: string
  severity?: 'low' | 'medium' | 'high'
  status?: string
}

export interface InternalNotePayload {
  student_id: number
  note_type: 'general' | 'review' | 'lesson' | 'risk' | 'follow_up'
  note: string
  ai_generated?: 0 | 1
}

export interface WritingAssistPayload {
  student_id: number
  prompt?: string
  answer: string
  sample_answer?: string
  criteria?: string
}
