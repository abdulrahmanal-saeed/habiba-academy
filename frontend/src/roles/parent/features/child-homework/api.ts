import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ChildHomeworkData } from './types'

export const fetchChildHomework = async (childId: number): Promise<ChildHomeworkData> => {
  const res = await apiClient.get<ApiOk<ChildHomeworkData>>(
    `/api/parent/child-homework?id=${childId}`,
  )
  return { child: res.child, homework: res.homework }
}
