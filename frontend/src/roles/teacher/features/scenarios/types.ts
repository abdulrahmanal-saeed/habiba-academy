export type ScenarioStatus = 'draft' | 'published' | 'closed'
export type ScenarioEffectiveStatus = ScenarioStatus | 'scheduled'

export interface ScenarioItem {
  id: number
  title: string
  sc_date: string
  publish_at: string | null
  status: ScenarioStatus
  effective_status: ScenarioEffectiveStatus
  situation: string | null
  prompt: string | null
  time_limit_seconds: number
  model_answer: string | null
  keywords: string[]
  recording_count: number
  created_at: string
}

export interface ScenarioCreatePayload {
  student_id: number
  title: string
  sc_date: string
  publish_time?: string
  status: ScenarioStatus
  situation?: string
  prompt?: string
  time_limit?: number
  keywords?: string
  model_answer?: string
}

export interface ScenarioRecording {
  id: number
  scenario_id: number
  title: string
  sc_date: string
  take_number: number
  recording_path: string | null
  audio_src: string | null
  submitted_at: string | null
  teacher_note: string | null
  chips: string[]
}
