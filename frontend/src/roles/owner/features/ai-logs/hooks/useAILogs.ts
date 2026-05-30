import { useQuery } from '@tanstack/react-query'
import { getAILogs } from '../api'

export function useAILogs(feature?: string, status?: string) {
  return useQuery({
    queryKey: ['owner-ai-logs', feature ?? '', status ?? ''],
    queryFn: () => getAILogs(feature, status),
    staleTime: 5_000,
  })
}
