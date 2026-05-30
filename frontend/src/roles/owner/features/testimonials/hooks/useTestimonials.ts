import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTestimonials, moderateTestimonial } from '../api'

const QK = ['owner-testimonials'] as const

export function useTestimonials() {
  return useQuery({ queryKey: QK, queryFn: getTestimonials, staleTime: 15_000 })
}

export function useModerateTestimonial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; action: 'approve' | 'reject'; source: 'student' | 'platform' | 'public' }) =>
      moderateTestimonial(vars.id, vars.action, vars.source),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
