export interface AcademyInfo {
  id: number
  name: string
  email: string | null
  status: string
}

export interface AcademyStudent {
  id: number
  full_name: string
  login_code: string
  level: string | null
  is_active: number
  completed_sessions: number
  upcoming_sessions: number
}

export interface AcademyKPIs {
  student_count: number
  total_completed: number
  total_upcoming: number
}

export interface AcademyHomeData {
  academy: AcademyInfo
  students: AcademyStudent[]
  kpis: AcademyKPIs
}
