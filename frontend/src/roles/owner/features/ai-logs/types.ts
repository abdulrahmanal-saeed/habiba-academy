export type AILogStatus = 'success' | 'failed' | 'cached'

export interface AILogEntry {
  id: number
  feature_key: string
  full_name: string | null
  student_id: number | null
  model: string
  status: AILogStatus
  cost_tokens_input: number
  cost_tokens_output: number
  estimated_cost_usd: string
  raw_prompt: string | null
  output_json: string | null
  error_message: string | null
  created_at: string
}

export interface AILogsHealth {
  total: number
  success: number
  failed: number
  cached: number
  api_key_configured: boolean
  api_key_masked: string
}

export interface AILogsData {
  logs: AILogEntry[]
  features: string[]
  health: AILogsHealth
}

export interface AILogsResponse {
  ok: boolean
  data: AILogsData
}
