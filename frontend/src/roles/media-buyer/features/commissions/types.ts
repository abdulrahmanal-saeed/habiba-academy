export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

export interface CommissionRow {
  id: number
  commission_amount_aed: string
  status: CommissionStatus
  created_at: string
}
