import type { EngagementStats, RevenueStats } from '../dashboard/types'

export type { EngagementStats, RevenueStats }

export interface AnalyticsOverview {
  total_visits: number
  unique_visitors: number
  active_now: number
  page_views: number
}

export interface DailyVisit {
  day_key: string
  visit_count: number
}

export interface DeviceBreakdown {
  device_type: string
  cnt: number
}

export interface HourlyPattern {
  hr: number
  cnt: number
}

export interface AnalyticsFunnel {
  visit: number
  pricing_view: number
  checkout_start: number
  checkout_submit: number
  payment_pending: number
  payment_paid: number
  student_form_submit: number
}

export interface MediaBuyerStat {
  full_name: string
  tracking_code: string
  visits: number
  conversions: number
  paid_amount: number
}

export interface LowActivityStudent {
  id: number
  full_name: string
  login_code: string
  last_seen: string | null
}

export interface TopPage {
  page_url: string
  page_title: string
  total_views: number
}

export interface RealtimeSession {
  session_id: string
  device_type: string
  last_activity_at: string
  page_url: string | null
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  daily_visits: DailyVisit[]
  device_breakdown: DeviceBreakdown[]
  hourly_pattern: HourlyPattern[]
  engagement: EngagementStats
  funnel: AnalyticsFunnel
  revenue: RevenueStats
  media_buyers: MediaBuyerStat[]
  low_activity_students: LowActivityStudent[]
  top_pages: TopPage[]
}

export interface RealtimeData {
  sessions: RealtimeSession[]
}

export type AnalyticsTab = 'overview' | 'funnel' | 'revenue' | 'engagement' | 'media-buyers'
