import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { BriefsData, BriefDetail, NewBriefPayload } from './types'

export const fetchBriefs = async (): Promise<BriefsData> => {
  const res = await apiClient.get<ApiOk<BriefsData>>('/api/academy/briefs')
  return { briefs: res.briefs }
}

export const fetchBriefDetail = async (id: number): Promise<BriefDetail> => {
  const res = await apiClient.get<ApiOk<{ brief: BriefDetail }>>(`/api/academy/briefs?id=${id}`)
  return res.brief
}

export const submitBrief = (payload: NewBriefPayload): Promise<ApiOk<{ id: number }>> =>
  apiClient.post<ApiOk<{ id: number }>>('/api/academy/briefs', payload as unknown as Record<string, unknown>)
