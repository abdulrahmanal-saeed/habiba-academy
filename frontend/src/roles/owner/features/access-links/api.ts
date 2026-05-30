import { apiClient } from '@/core/lib/apiClient'
import type { AccessLinksResponse, AccessLinksData } from './types'

const URL = '/api/owner/access-links'

export function getAccessLinks(): Promise<AccessLinksData> {
  return apiClient.get<AccessLinksResponse>(URL).then((r) => r.data)
}
