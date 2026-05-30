import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { MediaBuyerHomeData } from './types'

export const fetchMediaBuyerHome = async (): Promise<MediaBuyerHomeData> => {
  const res = await apiClient.get<ApiOk<MediaBuyerHomeData>>('/api/media-buyer/home')
  return { buyer: res.buyer, kpis: res.kpis, links: res.links }
}
