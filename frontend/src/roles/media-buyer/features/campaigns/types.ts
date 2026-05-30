import type { CommissionRow } from '../commissions/types'

export interface SourceBreakdown {
  source_label: string
  total: number
}

export interface DeviceBreakdown {
  device_type: string
  total: number
}

export interface VisitRow {
  first_seen_at: string
  source_label: string
  device_type: string
  country: string
  duration_seconds: number
  last_path: string
  last_event: string
}

export interface MediaBuyerStatsData {
  commissions: CommissionRow[]
  sources: SourceBreakdown[]
  devices: DeviceBreakdown[]
  recent_visits: VisitRow[]
}
