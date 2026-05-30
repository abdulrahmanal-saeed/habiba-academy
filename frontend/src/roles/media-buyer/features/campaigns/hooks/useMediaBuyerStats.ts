import { useQuery } from '@tanstack/react-query'
import { fetchMediaBuyerStats } from '../api'

export const useMediaBuyerStats = () =>
  useQuery({
    queryKey:  ['media-buyer-stats'],
    queryFn:   fetchMediaBuyerStats,
    staleTime: 30_000,
  })
