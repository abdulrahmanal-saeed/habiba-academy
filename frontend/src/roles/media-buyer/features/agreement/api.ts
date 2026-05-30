import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { AgreementData } from './types'

export const fetchAgreement = async (): Promise<AgreementData> => {
  const res = await apiClient.get<ApiOk<AgreementData>>('/api/media-buyer/agreement')
  return { template: res.template, already_accepted: res.already_accepted }
}

export const acceptAgreement = async (typedName: string): Promise<void> => {
  await apiClient.post<ApiOk<Record<string, never>>>('/api/media-buyer/agreement', {
    typed_name: typedName,
  } as unknown as Record<string, unknown>)
}
