import { apiClient } from '@/core/lib/apiClient'
import type { OwnerSettings, OwnerSettingsResponse, SettingsActionResponse, FeatureFlags } from './types'

const URL = '/api/owner/settings'

export function getSettings(): Promise<OwnerSettings> {
  return apiClient.get<OwnerSettingsResponse>(URL).then((r) => r.data)
}

export function updateFlags(flags: Partial<FeatureFlags>): Promise<string> {
  return apiClient
    .post<SettingsActionResponse>(URL, { action: 'update_flags', ...flags } as Record<string, unknown>)
    .then((r) => r.data.message)
}

export function updateProfile(form: FormData): Promise<string> {
  return apiClient.postForm<SettingsActionResponse>(URL, form).then((r) => r.data.message)
}
