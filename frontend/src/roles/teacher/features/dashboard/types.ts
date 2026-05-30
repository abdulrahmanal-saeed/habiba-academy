export interface TeacherKpis {
  students: number
  homeworks: number
  scenarios: number
  tests: number
  hw_pending: number
  sc_pending: number
  students_new: number
}

export interface TodayHomework {
  student_id: number
  student_name: string
  homework_id: number
  title: string
  submitted: boolean
  mcq_score: number | null
  mcq_total: number | null
  submitted_at: string | null
}

export interface TodayScenario {
  student_id: number
  student_name: string
  scenario_id: number
  title: string
  recorded: boolean
}

export interface TodayReview {
  student_id: number
  student_name: string
  review_id: number
  title: string
  review_type: string
  submitted: boolean
}

export interface PriorityItem {
  id: number
  student_id: number
  student_name: string
  type: string
  title: string
  score?: number
  priority?: number
  [key: string]: unknown
}

export interface CalendarSession {
  id: number
  student_id: number
  student_name: string
  title: string
  planned_date: string
  session_time: string | null
  status: string
}

export interface TeacherDashboard {
  kpis: TeacherKpis
  today_homework: TodayHomework[]
  today_scenarios: TodayScenario[]
  today_reviews: TodayReview[]
  priority_queue: PriorityItem[]
  calendar: CalendarSession[]
}
