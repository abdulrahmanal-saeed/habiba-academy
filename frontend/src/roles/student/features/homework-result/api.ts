import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { HomeworkResult } from './types'

/* Reuse — do not redeclare */
export { bookMarketingEvent } from '@/roles/student/features/dashboard/api'

export async function getHomeworkResult(id: number): Promise<HomeworkResult> {
  const res = await get<ApiOk<{ data: HomeworkResult }>>(
    `/api/student/homework-result.php?homework_id=${id}`,
  )
  return res.data
}
