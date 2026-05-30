import { get, postForm } from '@/core/lib/apiClient'
import type { SettingsResponse, UpdateSettingResponse } from './types'

const BASE = '/api/teacher/settings.php'

export const settingsApi = {
  async getSettings(): Promise<SettingsResponse> {
    return get<SettingsResponse>(BASE)
  },

  async updateSetting(key: string, value: string): Promise<UpdateSettingResponse> {
    return postForm<UpdateSettingResponse>(BASE, { setting_key: key, setting_value: value })
  },
}
