import { get, postForm } from '@/core/lib/apiClient'
import type { NotificationsListResponse, MarkReadResponse } from './types'

const BASE = '/api/teacher/notifications.php'

export const notificationsApi = {
  async getNotifications(params?: {
    unread_only?: boolean
    limit?: number
    offset?: number
  }): Promise<NotificationsListResponse> {
    const search = new URLSearchParams()
    if (params?.unread_only) search.set('unread_only', '1')
    if (params?.limit !== undefined) search.set('limit', String(params.limit))
    if (params?.offset !== undefined) search.set('offset', String(params.offset))
    const qs = search.toString()
    return get<NotificationsListResponse>(`${BASE}${qs ? '?' + qs : ''}`)
  },

  async markRead(notificationId: number): Promise<MarkReadResponse> {
    return postForm<MarkReadResponse>(BASE, {
      action: 'mark_read',
      notification_id: notificationId,
    })
  },

  async markAllRead(): Promise<MarkReadResponse> {
    return postForm<MarkReadResponse>(BASE, { action: 'mark_all' })
  },
}
