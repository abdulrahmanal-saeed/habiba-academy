export interface Scenario {
  id: number
  title: string
  sc_date: string
  publish_at: string | null
  time_limit_seconds: number
  situation: string | null
  prompt: string | null
  keywords: string[]
  model_answer: string | null
  recording_count: number
}

export interface ScenarioRecording {
  id: number
  take_no: number
  audio_path: string
  teacher_note: string | null
  submitted_at: string | null
  chips: string[]
}

export interface ScenarioDetail {
  scenario: Scenario
  recordings: ScenarioRecording[]
  next_take: number
}

export interface SubmitScenarioResult {
  recording_id: number
  take_no: number
  audio_path: string
}

export type ConfidenceRating = 1 | 2 | 3
