export interface MediaBuyerProfile {
  id: number
  full_name: string
  commission_rate: string | null
}

export interface MediaBuyerKPIs {
  orders_count: number
  paid_count: number
  paid_amount: number
  visits: number
  unique_sessions: number
  avg_duration: number
  visitors_count: number
  attribution_count: number
  conversions_count: number
}

export interface TrackingLinks {
  home: string
  pricing: string
  checkout_single: string
  checkout_monthly: string
  checkout_bundle: string
}

export interface MediaBuyerHomeData {
  buyer: MediaBuyerProfile
  kpis: MediaBuyerKPIs
  links: TrackingLinks
}
