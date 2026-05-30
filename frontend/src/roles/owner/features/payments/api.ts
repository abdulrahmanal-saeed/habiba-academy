import { apiClient } from '@/core/lib/apiClient'
import type {
  PaymentsListResponse, PaymentDetailResponse,
  UpdateStatusPayload, CheckZiinaPayload,
  ActionResponse, PaymentsFilters,
} from './types'

type ListData = PaymentsListResponse['data']
type DetailData = PaymentDetailResponse['data']

export const paymentsApi = {
  getList(filters: Partial<PaymentsFilters> = {}): Promise<ListData> {
    const params: Record<string, string> = {}
    if (filters.status) params.status = filters.status
    if (filters.q)      params.q      = filters.q
    return apiClient.get<PaymentsListResponse>('/api/owner/payments', { params }).then((r) => r.data)
  },

  getDetail(id: number): Promise<DetailData> {
    return apiClient.get<PaymentDetailResponse>('/api/owner/payments', { params: { id } }).then((r) => r.data)
  },

  updateStatus(payload: UpdateStatusPayload): Promise<ActionResponse['data']> {
    return apiClient.post<ActionResponse>('/api/owner/payments', payload as unknown as Record<string, unknown>).then((r) => r.data)
  },

  checkZiina(payload: CheckZiinaPayload): Promise<ActionResponse['data']> {
    return apiClient.post<ActionResponse>('/api/owner/payments', payload as unknown as Record<string, unknown>).then((r) => r.data)
  },
}
