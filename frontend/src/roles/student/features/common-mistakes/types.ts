export interface MistakeGuidance {
  title_en: string        // human-readable display name — show this, NOT raw tag
  title_ar: string
  meaning_en: string
  meaning_ar: string
  example_en: string      // correct-form example
  example_ar: string
  student_action_en: string
  student_action_ar: string
  // teacher_action_* fields exist in API response — intentionally not typed here
}

export interface CommonMistake {
  id: number
  tag: string             // raw internal tag — use guidance.title_en for display
  note: string | null
  is_mastered: 0 | 1
  guidance: MistakeGuidance
}
