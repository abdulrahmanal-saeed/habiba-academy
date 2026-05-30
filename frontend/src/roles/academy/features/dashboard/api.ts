import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { AcademyHomeData } from './types'

export const fetchAcademyHome = async (): Promise<AcademyHomeData> => {
  const res = await apiClient.get<ApiOk<AcademyHomeData>>('/api/academy/home')
  return { academy: res.academy, students: res.students, kpis: res.kpis }
}
