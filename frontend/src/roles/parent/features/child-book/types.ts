export interface ChildBookItem {
  id: number
  title_en: string
  title_ar: string
  level: string
  access_status: 'unlocked' | 'locked' | 'pending'
  total_lessons: number
  done_lessons: number
  progress_pct: number
}

export interface ChildBookData {
  child: { id: number; full_name: string; login_code: string; level: string }
  books: ChildBookItem[]
}
