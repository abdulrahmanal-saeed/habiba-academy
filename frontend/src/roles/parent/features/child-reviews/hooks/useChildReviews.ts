import { useQuery } from '@tanstack/react-query'
import { fetchChildReviews } from '../api'

export const useChildReviews = (childId: number) =>
  useQuery({
    queryKey: ['child-reviews', childId],
    queryFn: () => fetchChildReviews(childId),
    enabled: childId > 0,
    staleTime: 15_000,
  })
