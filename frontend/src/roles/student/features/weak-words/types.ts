export interface WeakWordGuidance {
  meaning_en: string
  meaning_ar: string
  student_action_en: string
  student_action_ar: string
  practice_prompt_en: string
  practice_prompt_ar: string
  source_note: string
  // teacher_action_* fields exist in API response — intentionally not typed here
}

export interface WeakWord {
  id: number
  word: string          // Arabic word / phrase — big display text
  note: string | null   // teacher annotation or translation
  is_mastered: 0 | 1   // PHP returns int (COALESCE default 0)
  guidance: WeakWordGuidance
}
