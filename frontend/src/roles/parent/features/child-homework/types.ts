export interface HomeworkItem {
  id: number
  title: string
  hw_status: string
  hw_date: string
  publish_at: string | null
  submitted: 0 | 1
  submitted_at: string | null
}

export interface ChildHomeworkData {
  child: { id: number; full_name: string; login_code: string; level: string }
  homework: HomeworkItem[]
}
