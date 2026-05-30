export interface MediaBuyerNotification {
  id: number
  title: string
  body: string
  url: string | null
  action_label: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationsData {
  notifications: MediaBuyerNotification[]
  unread_count: number
}
