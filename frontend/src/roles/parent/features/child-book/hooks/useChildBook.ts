import { useQuery } from '@tanstack/react-query'
import { fetchChildBook } from '../api'

export const useChildBook = (childId: number) =>
  useQuery({
    queryKey: ['child-book', childId],
    queryFn: () => fetchChildBook(childId),
    enabled: childId > 0,
    staleTime: 30_000,
  })
