export type BookSubmissionStatus =
  | 'draft' | 'in_progress' | 'submitted' | 'needs_correction'
  | 'feedback_sent' | 'completed' | 'resubmitted'

export interface BookSubmission {
  id: number
  student_id: number
  full_name: string
  login_code: string
  book_title: string
  lesson_title: string
  lesson_number: number
  unit_type: 'lesson' | 'review'
  status: BookSubmissionStatus
  auto_score: number
  teacher_score: number | null
  submitted_at: string | null
  reviewed_at: string | null
}

export interface BookAnswerItem {
  question_id: string
  answer: string
  is_correct: boolean
}

export interface BookAnswers {
  mcq?: BookAnswerItem[]
  arrange_words?: BookAnswerItem[]
  complete_sentence?: BookAnswerItem[]
  complete_conversation?: BookAnswerItem[]
  writing_task?: { answer: string }
  writing_tasks?: Record<string, { answer: string }>
  speaking_task?: { audio_url?: string }
  speaking_tasks?: Record<string, { audio_url?: string }>
  number_recognition?: BookAnswerItem[]
  listening_review?: BookAnswerItem[]
  time_recognition?: BookAnswerItem[]
  direction_recognition?: BookAnswerItem[]
  category_practice?: BookAnswerItem[]
  price_recognition?: BookAnswerItem[]
  color_recognition?: BookAnswerItem[]
  description_matching?: BookAnswerItem[]
  matching?: BookAnswerItem[]
  daily_action_matching?: BookAnswerItem[]
  direction_matching?: BookAnswerItem[]
  job_matching?: BookAnswerItem[]
  workplace_matching?: BookAnswerItem[]
  work_sentence_practice?: BookAnswerItem[]
  body_matching?: BookAnswerItem[]
  health_phrase_matching?: BookAnswerItem[]
  pain_sentence_practice?: BookAnswerItem[]
  conversation_phrase_matching?: BookAnswerItem[]
  topic_recognition?: BookAnswerItem[]
  reading_comprehension?: BookAnswerItem[]
  vocabulary_matching?: BookAnswerItem[]
  topic_category?: BookAnswerItem[]
  sequence_practice?: BookAnswerItem[]
  listening_numbers?: BookAnswerItem[]
  [key: string]: BookAnswerItem[] | Record<string, unknown> | undefined
}

export interface BookSpeakingData {
  teacher_feedback: string | null
  pronunciation_note: string | null
  fluency_note: string | null
  correction_note: string | null
  score: number | null
}

export interface BookSubmissionDetail {
  submission: {
    id: number
    student_id: number
    full_name: string
    login_code: string
    book_title: string
    lesson_title: string
    lesson_number: number
    unit_type: 'lesson' | 'review'
    status: BookSubmissionStatus
    auto_score: number
    teacher_score: number | null
    submitted_at: string | null
    reviewed_at: string | null
    final_feedback: string | null
  }
  answers: BookAnswers
  speaking: BookSpeakingData | null
  feedback: Record<'writing' | 'speaking' | 'correction' | 'general', string>
}

export interface BookFeedbackPayload {
  submission_id: number
  final_feedback: string
  teacher_score: string
  writing_feedback: string
  correction_feedback: string
  speaking_feedback: string
  pronunciation_note: string
  fluency_note: string
  speaking_correction_note: string
  speaking_score: string
}
