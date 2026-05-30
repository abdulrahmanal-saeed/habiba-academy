import { useQuery } from '@tanstack/react-query'
import { fetchBriefs } from '../api'

export const useBriefs = () =>
  useQuery({ queryKey: ['academy-briefs'], queryFn: fetchBriefs, staleTime: 10_000 })
