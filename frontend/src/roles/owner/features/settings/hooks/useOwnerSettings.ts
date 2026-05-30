import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateFlags, updateProfile } from '../api'
import type { OwnerSettings, FeatureFlags } from '../types'

const QK = ['owner-settings'] as const

export function useOwnerSettings() {
  return useQuery({
    queryKey: QK,
    queryFn: getSettings,
    staleTime: 60_000,
  })
}

export function useUpdateFlags() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (flags: Partial<FeatureFlags>) => updateFlags(flags),
    onMutate: async (flags) => {
      await qc.cancelQueries({ queryKey: QK })
      const prev = qc.getQueryData<OwnerSettings>(QK)
      if (prev) {
        qc.setQueryData<OwnerSettings>(QK, {
          ...prev,
          flags: { ...prev.flags, ...flags },
        })
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData<OwnerSettings>(QK, ctx.prev)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => updateProfile(form),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
