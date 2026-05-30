export interface ChildReviewItem {
  id: number
  title: string
  review_type: 'weekly_review' | 'monthly_review'
  review_date: string
  status: 'published' | 'closed'
  total_points: number
  submission_status: 'pending' | 'reviewed' | null
  total_score: number | null
  submitted_at: string | null
  teacher_note: string | null
}

export interface ChildReviewsData {
  child: { id: number; full_name: string; login_code: string; level: string }
  reviews: ChildReviewItem[]
}
