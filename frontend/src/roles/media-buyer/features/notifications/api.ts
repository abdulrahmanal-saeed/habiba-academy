import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { NotificationsData } from './types'

export const fetchNotifications = async (): Promise<NotificationsData> => {
  const res = await apiClient.get<ApiOk<NotificationsData>>('/api/media-buyer/notifications')
  return { notifications: res.notifications, unread_count: res.unread_count }
}

export const markAllRead = async (): Promise<void> => {
  await apiClient.post<ApiOk<Record<string, never>>>('/api/media-buyer/notifications', {} as Record<string, unknown>)
}
