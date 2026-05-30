import { useQuery } from '@tanstack/react-query'
import { fetchChildHomework } from '../api'

export const useChildHomework = (childId: number) =>
  useQuery({
    queryKey: ['child-homework', childId],
    queryFn: () => fetchChildHomework(childId),
    enabled: childId > 0,
    staleTime: 10_000,
  })
