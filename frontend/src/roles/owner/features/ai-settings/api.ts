import { apiClient } from '@/core/lib/apiClient'
import type { AISettings, AISettingsResponse, AISettingsActionResponse, AITestConnectionResponse, AISettingsData, AITestResult } from './types'

const URL = '/api/owner/ai-settings'

export function getAISettings(): Promise<AISettingsData> {
  return apiClient.get<AISettingsResponse>(URL).then((r) => r.data)
}

export function saveAISettings(settings: AISettings): Promise<AISettingsActionResponse['data']> {
  return apiClient.post<AISettingsActionResponse>(URL, { action: 'save', ...settings }).then((r) => r.data)
}

export function testConnection(): Promise<AITestResult> {
  return apiClient.post<AITestConnectionResponse>(URL, { action: 'test_connection' }).then((r) => r.data)
}
