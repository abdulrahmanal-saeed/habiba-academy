import { useQuery } from '@tanstack/react-query'
import { fetchChildProgress } from '../api'

export const useChildProgress = (childId: number) =>
  useQuery({
    queryKey: ['child-progress', childId],
    queryFn: () => fetchChildProgress(childId),
    enabled: childId > 0,
    staleTime: 30_000,
  })
