import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getParents, getStudentOptions, saveParent, deleteParent } from '../api'
import type { ParentSavePayload } from '../types'

const QK  = ['owner-parents'] as const
const SQK = ['owner-parent-students'] as const

export function useParents() {
  return useQuery({ queryKey: QK, queryFn: getParents, staleTime: 15_000 })
}

export function useStudentOptions() {
  return useQuery({ queryKey: SQK, queryFn: getStudentOptions, staleTime: 60_000 })
}

export function useSaveParent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ParentSavePayload) => saveParent(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteParent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteParent(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
