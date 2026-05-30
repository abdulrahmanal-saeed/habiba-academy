import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '../api'
import type { PaymentsFilters, PaymentStatus } from '../types'

const LIST_QK = (filters: Partial<PaymentsFilters>) => ['owner-payments', filters] as const
const DETAIL_QK = (id: number) => ['owner-payment-detail', id] as const

export function usePaymentsList(filters: Partial<PaymentsFilters> = {}) {
  return useQuery({
    queryKey: LIST_QK(filters),
    queryFn: () => paymentsApi.getList(filters),
    staleTime: 30_000,
  })
}

export function usePaymentDetail(id: number | null) {
  return useQuery({
    queryKey: DETAIL_QK(id ?? 0),
    queryFn: () => paymentsApi.getDetail(id!),
    enabled: id !== null && id > 0,
    staleTime: 30_000,
  })
}

export function useUpdateStatus(filters: Partial<PaymentsFilters> = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payment_status }: { id: number; payment_status: PaymentStatus }) =>
      paymentsApi.updateStatus({ action: 'update_status', id, payment_status }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: LIST_QK(filters) })
      void qc.invalidateQueries({ queryKey: DETAIL_QK(id) })
    },
  })
}

export function useCheckZiina(filters: Partial<PaymentsFilters> = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => paymentsApi.checkZiina({ action: 'check_ziina', id }),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: LIST_QK(filters) })
      void qc.invalidateQueries({ queryKey: DETAIL_QK(id) })
    },
  })
}
