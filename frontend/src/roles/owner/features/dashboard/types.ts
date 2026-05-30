export interface EngagementStats {
  hw_submitted_today: number
  hw_submitted_week: number
  reviews_submitted_week: number
  students_logged_in_today: number
  students_logged_in_week: number
  active_students: number
}

export interface PortalStats {
  academies: number
  academy_students: number
  parents: number
  parent_students: number
  media_buyers: number
}

export interface RevenuePlanRow {
  selected_plan: string
  total_orders: number
  paid_amount: number
}

export interface RevenueStatusRow {
  payment_status: string
  total: number
}

export interface RevenueStats {
  paid_amount: number
  paid_orders: number
  pending_orders: number
  by_plan: RevenuePlanRow[]
  by_status: RevenueStatusRow[]
}

export interface OwnerDashboardData {
  engagement: EngagementStats
  portals: PortalStats
  revenue: RevenueStats
  active_now: number
}
