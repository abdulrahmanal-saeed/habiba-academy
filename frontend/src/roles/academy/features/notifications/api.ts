import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { NotificationsData } from './types'

export const fetchNotifications = async (): Promise<NotificationsData> => {
  const res = await apiClient.get<ApiOk<NotificationsData>>('/api/academy/notifications')
  return { notifications: res.notifications, unread_count: res.unread_count }
}

export const markAllRead = (): Promise<ApiOk> =>
  apiClient.post<ApiOk>('/api/academy/notifications', {})
