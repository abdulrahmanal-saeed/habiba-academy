export interface OwnerStudentBalance {
  package_name: string
  used_sessions: number
  contract_sessions: number
  remaining_sessions: number
  income_total: number
}

export interface OwnerStudent {
  id: number
  full_name: string
  login_code: string
  level: string
  is_active: boolean
  created_at: string | null
  last_seen: string | null
  balance: OwnerStudentBalance | null
}
