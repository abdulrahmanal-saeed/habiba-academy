import { useQuery } from '@tanstack/react-query'
import { getRealtimeSessions } from '../api'

export const REALTIME_QK = ['owner-analytics-realtime'] as const

export function useRealtime() {
  return useQuery({
    queryKey: REALTIME_QK,
    queryFn: getRealtimeSessions,
    refetchInterval: 10_000,
    staleTime: 0,
  })
}
