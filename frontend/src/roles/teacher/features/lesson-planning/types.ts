export interface StudentContract {
  id: number
  student_id: number
  total_hours: number
  session_duration_minutes: number
  start_date: string
  notes: string
  package_name: string
  default_price_aed: number
  created_at: string
  updated_at: string | null
}

export type SessionStatus =
  | 'planned'
  | 'completed'
  | 'skipped'
  | 'rescheduled'
  | 'absent'
  | 'cancelled'

export interface LessonPlanSession {
  id: number
  contract_id: number
  student_id: number
  session_number: number
  title: string
  subject: string
  planned_date: string | null
  planned_time: string | null
  actual_date: string | null
  session_time: string | null
  duration_minutes: number
  skills: string            // CSV e.g. "grammar,vocabulary"
  skills_arr: string[]      // normalized array from backend
  goals: string
  teacher_notes: string
  attendance_note: string
  status: SessionStatus
  is_milestone: number      // 0 | 1
  milestone_label: string
  price: number
  is_paid: number           // 0 | 1
  created_at: string
  updated_at: string | null
}

export interface SkillBalance {
  skill: string
  count: number
  pct: number               // 0–100 relative to most-common skill
}

export interface LessonPlanStats {
  total: number
  done: number
  skipped: number
  absent: number
  cancelled: number
  rescheduled: number
  used_sessions: number
  remaining: number
  pct: number               // 0–100 progress
  hours_used: number
  total_hours: number
  hours_per_session: number
  month_sessions: number
  month_hours: number
  month_income: number
  total_income: number
  est_finish: string | null // "Jun 2026" or null when < 2 completed sessions
  skill_balance: SkillBalance[]
}

export interface LessonPlanData {
  contract: StudentContract | null
  sessions: LessonPlanSession[]
  stats: LessonPlanStats | null
}

export interface SessionSavePayload {
  id: number                // maps to $_POST['id'] in session-save.php
  student_id?: number
  title?: string
  planned_date?: string
  session_time?: string
  skills?: string           // CSV — backend normalizes
  goals?: string
  teacher_notes?: string
  is_milestone?: 0 | 1
  milestone_label?: string
}

export interface SessionStatusPayload {
  id: number
  status: SessionStatus
  actual_date?: string      // required for 'completed'
  planned_date?: string     // required for 'rescheduled'
}

export interface ContractSavePayload {
  student_id: number
  total_hours: number
  session_duration_minutes: number
  start_date: string
  notes?: string
  package_name?: string
  default_price_aed: number
}
