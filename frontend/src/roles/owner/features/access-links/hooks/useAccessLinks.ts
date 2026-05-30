import { useQuery } from '@tanstack/react-query'
import { getAccessLinks } from '../api'

export function useAccessLinks() {
  return useQuery({
    queryKey: ['owner-access-links'],
    queryFn: getAccessLinks,
    staleTime: 30_000,
  })
}
