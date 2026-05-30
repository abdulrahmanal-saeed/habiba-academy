import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActivationRequests, approveRequest, rejectRequest, needsMoreInfo } from '../api'

const qk = (status?: string) => ['owner-activation-requests', status ?? 'all'] as const

export function useActivationRequests(status?: string) {
  return useQuery({
    queryKey: qk(status),
    queryFn: () => getActivationRequests(status),
    staleTime: 15_000,
  })
}

export function useApproveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => approveRequest(id, note),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['owner-activation-requests'] }),
  })
}

export function useRejectRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => rejectRequest(id, note),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['owner-activation-requests'] }),
  })
}

export function useNeedsMoreInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => needsMoreInfo(id, note),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['owner-activation-requests'] }),
  })
}
