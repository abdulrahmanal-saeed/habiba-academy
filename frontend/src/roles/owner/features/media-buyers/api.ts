import { apiClient } from '@/core/lib/apiClient'
import type {
  MediaBuyer, AgreementTemplate,
  MediaBuyerListResponse, AgreementResponse, MediaBuyerActionResponse,
} from './types'

const URL = '/api/owner/media-buyers'

export function getMediaBuyers(): Promise<MediaBuyer[]> {
  return apiClient.get<MediaBuyerListResponse>(URL).then((r) => r.data.buyers)
}

export function getAgreementTemplate(): Promise<AgreementTemplate> {
  return apiClient.get<AgreementResponse>(URL, { params: { action: 'agreement' } })
    .then((r) => r.data.template)
}

export function saveMediaBuyer(form: FormData): Promise<MediaBuyerActionResponse['data']> {
  return apiClient.postForm<MediaBuyerActionResponse>(URL, form).then((r) => r.data)
}

export function deleteMediaBuyer(buyerId: number): Promise<MediaBuyerActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'delete')
  fd.append('buyer_id', String(buyerId))
  return apiClient.postForm<MediaBuyerActionResponse>(URL, fd).then((r) => r.data)
}

export function saveAgreement(form: FormData): Promise<MediaBuyerActionResponse['data']> {
  return apiClient.postForm<MediaBuyerActionResponse>(URL, form).then((r) => r.data)
}
