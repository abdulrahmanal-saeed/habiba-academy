export interface AcademyNotification {
  id: number
  title: string
  body: string
  action_label: string | null
  url: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationsData {
  notifications: AcademyNotification[]
  unread_count: number
}
