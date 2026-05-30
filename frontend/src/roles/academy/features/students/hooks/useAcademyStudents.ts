import { useQuery } from '@tanstack/react-query'
import { fetchAcademyStudents } from '../api'

export const useAcademyStudents = () =>
  useQuery({ queryKey: ['academy-students'], queryFn: fetchAcademyStudents, staleTime: 30_000 })
