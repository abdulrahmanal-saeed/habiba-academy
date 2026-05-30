import { useQuery } from '@tanstack/react-query'
import { fetchBriefDetail } from '../api'

export const useBriefDetail = (id: number) =>
  useQuery({
    queryKey: ['academy-brief', id],
    queryFn: () => fetchBriefDetail(id),
    enabled: id > 0,
    staleTime: 15_000,
  })
