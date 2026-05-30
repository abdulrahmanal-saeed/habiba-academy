import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { AcademyStudentsData } from './types'

export const fetchAcademyStudents = async (): Promise<AcademyStudentsData> => {
  const res = await apiClient.get<ApiOk<AcademyStudentsData>>('/api/academy/students')
  return { students: res.students, kpis: res.kpis }
}
