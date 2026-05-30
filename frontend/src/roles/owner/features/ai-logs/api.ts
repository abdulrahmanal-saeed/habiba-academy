import { apiClient } from '@/core/lib/apiClient'
import type { AILogsResponse, AILogsData } from './types'

const URL = '/api/owner/ai-logs'

export function getAILogs(feature?: string, status?: string): Promise<AILogsData> {
  const params: Record<string, string> = {}
  if (feature) params.feature = feature
  if (status) params.status = status
  return apiClient.get<AILogsResponse>(URL, { params }).then((r) => r.data)
}
