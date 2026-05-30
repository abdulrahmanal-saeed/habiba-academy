import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../api'
import type { SiteSettings } from '../types'

const QK = ['teacher-settings']

export function useSettings() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: QK,
    queryFn: () => settingsApi.getSettings(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      settingsApi.updateSetting(key, value),

    onMutate: async ({ key, value }) => {
      await qc.cancelQueries({ queryKey: QK })
      const prev = qc.getQueryData<{ settings: SiteSettings }>(QK)
      if (prev) {
        qc.setQueryData(QK, {
          ...prev,
          settings: { ...prev.settings, [key]: value },
        })
      }
      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev)
    },

    onSettled: () => void qc.invalidateQueries({ queryKey: QK }),
  })

  return {
    settings: query.data?.settings ?? {},
    isLoading: query.isLoading,
    updateSetting: (key: string, value: string) => updateMutation.mutate({ key, value }),
    isUpdating: updateMutation.isPending,
  }
}
