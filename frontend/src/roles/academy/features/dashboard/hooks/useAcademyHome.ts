import { useQuery } from '@tanstack/react-query'
import { fetchAcademyHome } from '../api'

export const useAcademyHome = () =>
  useQuery({ queryKey: ['academy-home'], queryFn: fetchAcademyHome, staleTime: 30_000 })
