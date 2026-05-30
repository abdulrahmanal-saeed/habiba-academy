import { apiClient } from '@/core/lib/apiClient'
import type { AnalyticsData, RealtimeData } from './types'

interface AnalyticsResponse { ok: boolean; data: AnalyticsData }
interface RealtimeResponse  { ok: boolean; data: RealtimeData }

export function getAnalytics(): Promise<AnalyticsData> {
  return apiClient.get<AnalyticsResponse>('/api/owner/analytics').then((r) => r.data)
}

export function getRealtimeSessions(): Promise<RealtimeData> {
  return apiClient.get<RealtimeResponse>('/api/owner/analytics?partial=realtime').then((r) => r.data)
}
