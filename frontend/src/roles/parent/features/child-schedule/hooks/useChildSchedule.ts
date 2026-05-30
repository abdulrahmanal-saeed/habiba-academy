import { useQuery } from '@tanstack/react-query'
import { fetchChildSchedule } from '../api'

export const useChildSchedule = (childId: number) =>
  useQuery({
    queryKey: ['child-schedule', childId],
    queryFn: () => fetchChildSchedule(childId),
    enabled: childId > 0,
    staleTime: 30_000,
  })
