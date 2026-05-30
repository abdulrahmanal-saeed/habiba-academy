import { useQuery } from '@tanstack/react-query'
import { fetchParentHome } from '../api'

export const useParentHome = () =>
  useQuery({ queryKey: ['parent-home'], queryFn: fetchParentHome, staleTime: 30_000 })
