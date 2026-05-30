import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api'

const QK = ['owner-dashboard'] as const

export function useDashboard() {
  return useQuery({
    queryKey: QK,
    queryFn: getDashboard,
    staleTime: 60_000,
  })
}
