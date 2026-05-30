export interface TeacherNotification {
  id: number
  notification_type: string
  title: string
  body: string
  url: string
  action_label: string
  priority: 'low' | 'normal' | 'high'
  is_read: boolean
  read_at: string | null
  created_at: string
  student_id: number | null
  submission_id: number | null
  book_id: number | null
  metadata_json: string | null
}

export interface NotificationsListResponse {
  notifications: TeacherNotification[]
  unread_count: number
  total: number
}

export interface MarkReadResponse {
  unread_count: number
}
