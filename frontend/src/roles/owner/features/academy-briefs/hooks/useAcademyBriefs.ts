import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBriefs, getBriefDetail, updateBriefStatus } from '../api'
import type { BriefStatus } from '../types'

const LIST_QK = ['owner-academy-briefs'] as const
const detailQK = (id: number) => ['owner-academy-brief', id] as const

export function useAcademyBriefs() {
  return useQuery({ queryKey: LIST_QK, queryFn: getBriefs, staleTime: 30_000 })
}

export function useAcademyBriefDetail(id: number) {
  return useQuery({
    queryKey: detailQK(id),
    queryFn: () => getBriefDetail(id),
    enabled: id > 0,
    staleTime: 30_000,
  })
}

export function useUpdateBriefStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: BriefStatus; notes: string }) =>
      updateBriefStatus(id, status, notes),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: LIST_QK })
      void qc.invalidateQueries({ queryKey: detailQK(id) })
    },
  })
}
