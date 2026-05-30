import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ChildProgressData } from './types'

export const fetchChildProgress = async (childId: number): Promise<ChildProgressData> => {
  const res = await apiClient.get<ApiOk<ChildProgressData>>(
    `/api/parent/child-progress?id=${childId}`,
  )
  return { child: res.child, balance: res.balance, stats: res.stats }
}
