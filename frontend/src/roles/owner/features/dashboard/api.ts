import { apiClient } from '@/core/lib/apiClient'
import type { OwnerDashboardData } from './types'

interface DashboardResponse { ok: boolean; data: OwnerDashboardData }

export function getDashboard(): Promise<OwnerDashboardData> {
  return apiClient.get<DashboardResponse>('/api/owner/home').then((r) => r.data)
}
