import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMediaBuyers, getAgreementTemplate, saveMediaBuyer, deleteMediaBuyer, saveAgreement } from '../api'

const LIST_QK = ['owner-media-buyers'] as const
const AGREEMENT_QK = ['owner-mb-agreement'] as const

export function useMediaBuyers() {
  return useQuery({ queryKey: LIST_QK, queryFn: getMediaBuyers, staleTime: 30_000 })
}

export function useAgreementTemplate() {
  return useQuery({ queryKey: AGREEMENT_QK, queryFn: getAgreementTemplate, staleTime: 120_000 })
}

export function useSaveMediaBuyer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => saveMediaBuyer(form),
    onSuccess: () => void qc.invalidateQueries({ queryKey: LIST_QK }),
  })
}

export function useDeleteMediaBuyer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMediaBuyer(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: LIST_QK }),
  })
}

export function useSaveAgreement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => saveAgreement(form),
    onSuccess: () => void qc.invalidateQueries({ queryKey: AGREEMENT_QK }),
  })
}
