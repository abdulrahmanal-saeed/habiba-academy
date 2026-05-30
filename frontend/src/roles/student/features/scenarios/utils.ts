import type { ConfidenceRating } from './types'

export function getStoredRating(scenarioId: number, takeNo: number): ConfidenceRating | null {
  try {
    const v = localStorage.getItem(`sc_rate_${scenarioId}_${takeNo}`)
    const n = Number(v)
    if (n === 1 || n === 2 || n === 3) return n as ConfidenceRating
  } catch { /* ignore */ }
  return null
}

export function saveRating(scenarioId: number, takeNo: number, rating: ConfidenceRating): void {
  try {
    localStorage.setItem(`sc_rate_${scenarioId}_${takeNo}`, String(rating))
  } catch { /* quota exceeded */ }
}
