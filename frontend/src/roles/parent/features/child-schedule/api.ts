import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ChildScheduleData } from './types'

export const fetchChildSchedule = async (childId: number): Promise<ChildScheduleData> => {
  const res = await apiClient.get<ApiOk<ChildScheduleData>>(
    `/api/parent/child-schedule?id=${childId}`,
  )
  return { child: res.child, sessions: res.sessions, stats: res.stats }
}
