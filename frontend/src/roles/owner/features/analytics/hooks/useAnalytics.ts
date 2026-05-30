import { useQuery } from '@tanstack/react-query'
import { getAnalytics } from '../api'

export const ANALYTICS_QK = ['owner-analytics'] as const

export function useAnalytics() {
  return useQuery({
    queryKey: ANALYTICS_QK,
    queryFn: getAnalytics,
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  })
}
