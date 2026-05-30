export interface AISettings {
  ai_enabled: '0' | '1'
  ai_provider: string
  ai_model: string
  ai_regenerate_limit_per_day: string
  ai_cost_per_1k_input: string
  ai_cost_per_1k_output: string
}

export interface AIConnectionStatus {
  status: 'configured' | 'not configured' | 'connection failed'
  message: string
}

export interface AISettingsData {
  settings: AISettings
  api_key_status: string
  connection: AIConnectionStatus
  connection_checked_at: string
}

export interface AISettingsResponse {
  ok: boolean
  data: AISettingsData
}

export interface AISettingsActionResponse {
  ok: boolean
  data: { message: string }
}

export interface AITestResult {
  ok: boolean
  status: string
  message: string
}

export interface AITestConnectionResponse {
  ok: boolean
  data: AITestResult
}
