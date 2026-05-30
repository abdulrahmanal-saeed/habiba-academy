export interface MediaBuyer {
  id: number
  full_name: string
  email: string | null
  whatsapp: string | null
  commission_rate: number | null
  status: 'active' | 'paused' | 'inactive'
  notes: string | null
  access_code: string | null
  created_at: string
  visits_count: number
  attributed_visitors: number
  paid_orders_count: number
  paid_amount: number
}

export interface AgreementTemplate {
  id: number
  title: string
  version: string
  content: string
  active: 1 | 0
  requires_reacceptance: 1 | 0
  created_at?: string
}

export interface MediaBuyerListResponse {
  ok: boolean
  data: { buyers: MediaBuyer[] }
}

export interface AgreementResponse {
  ok: boolean
  data: { template: AgreementTemplate }
}

export interface MediaBuyerActionResponse {
  ok: boolean
  data: { id?: number; message?: string }
}
