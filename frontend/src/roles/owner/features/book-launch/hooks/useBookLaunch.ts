import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBookLaunchData, launchBook, saveBookLaunchSettings } from '../api'
import type { BookLaunchSettings } from '../types'

const QK = ['owner-book-launch'] as const

export function useBookLaunch() {
  return useQuery({ queryKey: QK, queryFn: getBookLaunchData, staleTime: 15_000 })
}

export function useLaunchAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (action: 'launch' | 'hide' | 'pause') => launchBook(action),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useSaveLaunchSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ settings, changeNote }: { settings: BookLaunchSettings; changeNote: string }) =>
      saveBookLaunchSettings(settings, changeNote),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
