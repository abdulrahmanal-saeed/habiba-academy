import { get, post } from '@/core/lib/apiClient'

export type NotificationType =
  | 'homework_feedback'
  | 'new_material'
  | 'lesson_reminder'
  | 'review_result'
  | 'book_feedback'
  | 'general'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  link?: string
  createdAt: string
}

interface NotificationsResponse {
  ok: true
  unreadCount: number
  items: Notification[]
}

export async function getNotifications(): Promise<NotificationsResponse> {
  return get<NotificationsResponse>('/api/notifications')
}

export async function markAsRead(id: number): Promise<{ ok: true }> {
  return post<{ ok: true }>(`/api/notifications/${id}/read`)
}

export async function markAllRead(): Promise<{ ok: true; markedCount: number }> {
  return post<{ ok: true; markedCount: number }>('/api/notifications/read-all')
}
