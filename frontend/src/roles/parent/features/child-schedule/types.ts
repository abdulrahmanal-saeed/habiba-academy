export type SessionStatus = 'planned' | 'completed' | 'skipped' | 'rescheduled' | 'absent' | 'cancelled'

export interface ScheduleSession {
  id: number
  session_number: number
  title: string
  planned_date: string | null
  session_time: string | null
  duration_minutes: number
  status: SessionStatus
  subject: string
  is_milestone: 0 | 1
  milestone_label: string
}

export interface ScheduleStats {
  total: number
  done: number
  upcoming: number
  remaining: number
  pct: number
}

export interface ChildScheduleData {
  child: { id: number; full_name: string; login_code: string; level: string }
  sessions: ScheduleSession[]
  stats: ScheduleStats | null
}
