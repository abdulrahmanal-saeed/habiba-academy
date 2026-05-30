import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ParentHomeData } from './types'

export const fetchParentHome = async (): Promise<ParentHomeData> => {
  const res = await apiClient.get<ApiOk<ParentHomeData>>('/api/parent/home')
  return {
    parent: res.parent,
    students: res.students,
    upcoming: res.upcoming,
    kpis: res.kpis,
  }
}
