import { apiClient } from '@/core/lib/apiClient'
import type {
  AcademyBrief, BriefStatus,
  BriefListResponse, BriefDetailResponse, BriefActionResponse,
} from './types'

const URL = '/api/owner/academy-briefs'

export function getBriefs(): Promise<AcademyBrief[]> {
  return apiClient.get<BriefListResponse>(URL).then((r) => r.data.briefs)
}

export function getBriefDetail(id: number): Promise<AcademyBrief> {
  return apiClient.get<BriefDetailResponse>(URL, { params: { id } }).then((r) => r.data.brief)
}

export function updateBriefStatus(
  id: number,
  briefStatus: BriefStatus,
  ownerNotes: string,
): Promise<BriefActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'update_status')
  fd.append('id', String(id))
  fd.append('brief_status', briefStatus)
  fd.append('owner_notes', ownerNotes)
  return apiClient.postForm<BriefActionResponse>(URL, fd).then((r) => r.data)
}
