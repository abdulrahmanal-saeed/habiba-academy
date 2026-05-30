export interface ScoreHistoryItem {
  title: string
  mcq_score: number
  mcq_total: number
  submitted_at: string
}

export interface Achievement {
  emoji: string
  title_en: string
  title_ar: string
}

export interface StudentProgress {
  full_name: string
  level: string | null
  hw_count: number
  avg_pct: number | null
  sc_count: number
  perf_count: number
  sess_count: number
  streak: number
  score_history: ScoreHistoryItem[]
  achievements: Achievement[]
  all_achievements: Achievement[]
}

export interface CefrMeta {
  desc_en: string
  desc_ar: string
  color: string
  bg: string
}

// CEFR-standard data colors — not brand colors. Exception to Rule 3.
export const CEFR_META: Record<string, CefrMeta> = {
  A1: { desc_en: 'Absolute Beginner', desc_ar: 'مبتدئ كامل',       color: '#64748b', bg: '#f1f5f9' },
  A2: { desc_en: 'Beginner',          desc_ar: 'مبتدئ',             color: '#0891b2', bg: '#e0f2fe' },
  B1: { desc_en: 'Intermediate',      desc_ar: 'متوسط',             color: '#059669', bg: '#d1fae5' },
  B2: { desc_en: 'Upper Intermediate',desc_ar: 'فوق المتوسط',       color: '#7c3aed', bg: '#ede9fe' },
  C1: { desc_en: 'Advanced',          desc_ar: 'متقدم',             color: '#b45309', bg: '#fef3c7' },
  C2: { desc_en: 'Mastery',           desc_ar: 'إتقان',             color: '#be123c', bg: '#ffe4e6' },
}

export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
