export interface StudentDetail {
  id: number
  full_name: string
  login_code: string
  level: string
  is_active: boolean
  last_seen: string | null
  submitted_count: number
  avg_score: number
  recordings_count: number
  balance: {
    package_name: string
    used_sessions: number
    contract_sessions: number
    remaining_sessions: number
  } | null
}

export interface SubmissionItem {
  id: number
  item_type: 'homework' | 'review' | 'scenario'
  title: string
  hw_date: string
  sort_at: string
  status: 'draft' | 'published' | 'closed'
  effective_status: 'draft' | 'scheduled' | 'published' | 'closed'
  is_submitted: boolean
  mcq_score: number
  mcq_total: number
  submitted_at: string | null
  teacher_note?: string | null
  review_status?: string | null
  recordings_count?: number
}

export interface WeakWord {
  id: number
  word: string
  note: string | null
  created_at: string
  is_mastered: number
  mastered_at: string | null
  guidance: string
}

export interface Mistake {
  id: number
  mistake_tag: string
  note: string | null
  created_at: string
  is_mastered: number
  guidance: string
}

export interface ScenarioRecording {
  id: number
  scenario_id: number
  title: string
  sc_date: string
  take_number: number
  recording_path: string | null
  audio_src: string | null
  submitted_at: string | null
  teacher_note: string | null
  chips: string[]
}

export interface ScheduleSlot {
  id: number
  student_id: number
  day_of_week: number
  session_time: string
  duration_minutes: number
  price_override: number | null
  is_active: number
  updated_at: string | null
}

export interface CourseMaterial {
  id: number
  title: string
  type: string
  href: string
  is_file: boolean
  description: string | null
  sort_order: number
  is_published: number
  created_at: string
}

export interface StudentBookSubmission {
  id: number
  book_title: string
  lesson_title: string
  lesson_number: number
  unit_type: string
  status: string
  auto_score: number
  teacher_score: number | null
  submitted_at: string | null
  reviewed_at: string | null
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

export type StudentDetailTab =
  | 'overview'
  | 'submissions'
  | 'reviews'
  | 'weak-words'
  | 'mistakes'
  | 'scenarios'
  | 'materials'
  | 'schedule'
  | 'book'
