import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAISettings, saveAISettings, testConnection } from '../api'
import type { AISettings } from '../types'

const QK = ['owner-ai-settings'] as const

export function useAISettings() {
  return useQuery({ queryKey: QK, queryFn: getAISettings, staleTime: 15_000 })
}

export function useSaveAISettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: AISettings) => saveAISettings(settings),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useTestConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: testConnection,
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
