export interface ParentBalance {
  package_name: string | null
  contract_sessions: number
  completed_sessions: number
  planned_sessions: number
  remaining_sessions: number
  expiry_date: string | null
}

export interface ParentStudent {
  id: number
  full_name: string
  login_code: string
  level: string
  balance: ParentBalance
}

export interface UpcomingSession {
  id: number
  student_id: number
  student_name: string
  planned_date: string
  planned_time: string
  duration_minutes: number
  status: 'planned' | 'rescheduled'
  goals: string
}

export interface ParentHomeData {
  parent: { full_name: string }
  students: ParentStudent[]
  upcoming: UpcomingSession[]
  kpis: { student_count: number; upcoming_count: number }
}
