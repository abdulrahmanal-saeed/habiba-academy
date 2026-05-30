// ── Primitives ────────────────────────────────────────────────────────────────

export type LessonStatus =
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'needs_correction'
  | 'feedback_sent'
  | 'completed'
  | 'resubmitted'

export type UnitType = 'lesson' | 'review'

export type RecordingState = 'idle' | 'recording' | 'uploading' | 'done' | 'error'

// ── Book structure ────────────────────────────────────────────────────────────

export interface Book {
  id: number
  title_en: string
  title_ar: string
  slug: string
  level: string
  status: string
  price: number
}

export interface BookLesson {
  id: number
  lesson_number: number
  unit_type: UnitType
  title_en: string
  title_ar: string
  slug: string
  submission_status?: LessonStatus
  auto_score?: number
  submission_id?: number
}

// ── Content primitives ────────────────────────────────────────────────────────

export interface VocabCard {
  key: string
  arabic: string
  pronunciation: string
  meaning: string
  example: string
  category?: string
}

export interface Sentence {
  ar: string
  en: string
}

export interface AudioBlockContent {
  key: string
  title: string
  file: string
}

export interface GrammarTip {
  title?: string
  body?: string
  examples?: Array<{ ar: string; en: string }>
}

export interface ReviewGroup {
  title: string
  items: string[]
}

export interface ConversationChunk {
  title?: string
  arabic: string[]
  note?: string
}

// ── Exercise primitives ───────────────────────────────────────────────────────

export interface ChoiceQuestion {
  id: string
  question: string
  options: Record<string, string>
}

export interface MatchingItem {
  id: string
  arabic: string
}

export interface SequenceItem {
  id: string
  sentence: string
}

export interface CompleteItem {
  id: string
  prompt: string
}

export interface ArrangeWordsItem {
  id: string
  words: string[]
}

export interface SpeakingTask {
  key: string
  title?: string
  instructions?: string
  max_duration_label?: string
}

export interface WritingTaskDef {
  key: string
  title?: string
  instructions?: string
  placeholder?: string
  min_sentences?: number
}

// ── Full lesson content (all 30+ fields) ──────────────────────────────────────

export interface LessonContent {
  lesson_number: number
  unit_type: UnitType
  display_label?: string
  goal_en: string
  goal_ar: string
  goal_checks?: string[]
  situation_en?: string
  situation_ar?: string
  safety_disclaimer_en?: string
  safety_disclaimer_ar?: string
  warmup_title?: string
  warmup_questions?: string[]
  conversation_chunks?: ConversationChunk[]
  vocabulary?: VocabCard[]
  audio_blocks?: AudioBlockContent[]
  sentences?: Sentence[]
  grammar_tip?: GrammarTip
  dialogue_ar?: string[]
  dialogue_en?: string[]
  review_overview?: ReviewGroup[]
  self_check?: Record<string, string>
  self_check_min?: number
  submit_label?: string
  // Writing
  writing_title?: string
  writing_instructions?: string
  writing_placeholder?: string
  min_sentences?: number
  writing_tasks?: WritingTaskDef[]
  // Speaking
  speaking_title?: string
  speaking_instructions?: string
  speaking_tasks?: SpeakingTask[]
  // 14 radio-group (choice) exercise types
  mcq?: ChoiceQuestion[]
  number_recognition?: ChoiceQuestion[]
  listening_numbers?: ChoiceQuestion[]
  listening_review?: ChoiceQuestion[]
  color_recognition?: ChoiceQuestion[]
  time_recognition?: ChoiceQuestion[]
  direction_recognition?: ChoiceQuestion[]
  work_sentence_practice?: ChoiceQuestion[]
  pain_sentence_practice?: ChoiceQuestion[]
  topic_recognition?: ChoiceQuestion[]
  topic_category?: ChoiceQuestion[]
  category_practice?: ChoiceQuestion[]
  price_recognition?: ChoiceQuestion[]
  reading_comprehension?: ChoiceQuestion[]
  // 10 dropdown-match exercise types
  matching?: MatchingItem[]
  matching_options?: string[]
  description_matching?: MatchingItem[]
  description_matching_options?: string[]
  daily_action_matching?: MatchingItem[]
  daily_action_matching_options?: string[]
  direction_matching?: MatchingItem[]
  direction_matching_options?: string[]
  job_matching?: MatchingItem[]
  job_matching_options?: string[]
  workplace_matching?: MatchingItem[]
  workplace_matching_options?: string[]
  body_matching?: MatchingItem[]
  body_matching_options?: string[]
  health_phrase_matching?: MatchingItem[]
  health_phrase_matching_options?: string[]
  conversation_phrase_matching?: MatchingItem[]
  conversation_phrase_matching_options?: string[]
  vocabulary_matching?: MatchingItem[]
  vocabulary_matching_options?: string[]
  // Other open-ended
  sequence_practice?: SequenceItem[]
  complete_sentence?: CompleteItem[]
  complete_conversation?: CompleteItem[]
  arrange_words?: ArrangeWordsItem[]
}

// ── Parsed answers (from answers_json) ───────────────────────────────────────

export interface AnswerRow {
  question_id: string
  answer: string
  is_correct?: boolean
  sentence?: string
}

export interface ParsedAnswers {
  warmup?: Record<string, string>
  writing_task?: { answer: string }
  writing_tasks?: Record<string, { answer: string }>
  speaking_task?: { audio_url: string; duration_seconds: number }
  speaking_tasks?: Record<string, { audio_url: string; duration_seconds: number }>
  self_check?: string[]
  mcq?: AnswerRow[]
  number_recognition?: AnswerRow[]
  listening_numbers?: AnswerRow[]
  listening_review?: AnswerRow[]
  color_recognition?: AnswerRow[]
  time_recognition?: AnswerRow[]
  direction_recognition?: AnswerRow[]
  work_sentence_practice?: AnswerRow[]
  pain_sentence_practice?: AnswerRow[]
  topic_recognition?: AnswerRow[]
  topic_category?: AnswerRow[]
  category_practice?: AnswerRow[]
  price_recognition?: AnswerRow[]
  reading_comprehension?: AnswerRow[]
  matching?: AnswerRow[]
  description_matching?: AnswerRow[]
  daily_action_matching?: AnswerRow[]
  direction_matching?: AnswerRow[]
  job_matching?: AnswerRow[]
  workplace_matching?: AnswerRow[]
  body_matching?: AnswerRow[]
  health_phrase_matching?: AnswerRow[]
  conversation_phrase_matching?: AnswerRow[]
  vocabulary_matching?: AnswerRow[]
  sequence_practice?: AnswerRow[]
  complete_sentence?: AnswerRow[]
  complete_conversation?: AnswerRow[]
  arrange_words?: AnswerRow[]
}

// ── Submission ────────────────────────────────────────────────────────────────

export interface LessonSubmission {
  id: number
  status: LessonStatus
  answers_json: string
  auto_score: number
  teacher_score?: number
  final_feedback?: string
  submitted_at?: string
  reviewed_at?: string
}

export interface SpeakingSubmissionData {
  audio_url?: string
  teacher_feedback?: string
  pronunciation_note?: string
  fluency_note?: string
  correction_note?: string
  score?: number
}

export interface TeacherFeedback {
  writing?: string
  correction?: string
  speaking?: string
  general?: string
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface BookListItem extends Book {
  access_status: string
  progress_pct: number
}

export interface BookListData {
  books: BookListItem[]
}

export interface BookViewData {
  book: Book
  lessons: BookLesson[]
  continue_lesson_id?: number
}

export interface BookLessonMeta extends BookLesson {
  book_title_en: string
  book_level: string
  book_id: number
  prev_lesson_id?: number | null
  next_lesson_id?: number | null
}

export interface BookLessonData {
  lesson: BookLessonMeta
  content: LessonContent
  submission: LessonSubmission | null
  answers: ParsedAnswers
}

export interface FeedbackSubmission extends LessonSubmission {
  lesson_title: string
  book_title: string
  lesson_id: number
  unit_type: UnitType
}

export interface FeedbackPageData {
  submission: FeedbackSubmission
  answers: ParsedAnswers
  feedback: TeacherFeedback
  speaking: SpeakingSubmissionData
}

export interface SubmissionRow {
  id: number
  student_name: string
  login_code: string
  book_title: string
  lesson_title: string
  lesson_number: number
  unit_type: UnitType
  status: LessonStatus
  auto_score: number
  submitted_at?: string
  final_feedback?: string
  teacher_score?: number
  reviewed_at?: string
}

export interface SubmissionsListData {
  submissions: SubmissionRow[]
}

export interface SubmissionDetailData {
  submission: SubmissionRow
  answers: ParsedAnswers
  speaking: SpeakingSubmissionData
  feedback: TeacherFeedback
}

export interface DraftResult {
  submission_id: number
  auto_score: number
}

export interface SubmitResult {
  submission_id: number
  auto_score: number
}

export interface SpeakingUploadResult {
  audio_url: string
  duration_seconds: number
}
