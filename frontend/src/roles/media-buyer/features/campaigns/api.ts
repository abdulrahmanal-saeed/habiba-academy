import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { MediaBuyerStatsData } from './types'

export const fetchMediaBuyerStats = async (): Promise<MediaBuyerStatsData> => {
  const res = await apiClient.get<ApiOk<MediaBuyerStatsData>>('/api/media-buyer/stats')
  return {
    commissions:   res.commissions,
    sources:       res.sources,
    devices:       res.devices,
    recent_visits: res.recent_visits,
  }
}
