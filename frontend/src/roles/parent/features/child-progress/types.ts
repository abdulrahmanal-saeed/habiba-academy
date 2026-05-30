export interface ChildBalance {
  package_name: string | null
  contract_sessions: number
  completed_sessions: number
  planned_sessions: number
  remaining_sessions: number
  expiry_date: string | null
}

export interface ChildStats {
  hw_count: number
  hw_avg_pct: number | null
  rv_count: number
  rv_avg_pct: number | null
}

export interface ChildProgressData {
  child: { id: number; full_name: string; level: string }
  balance: ChildBalance | null
  stats: ChildStats
}
