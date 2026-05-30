import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { StudentProgress } from './types'

export async function getProgress(): Promise<StudentProgress> {
  const res = await get<ApiOk<{ data: StudentProgress }>>('/api/student/progress.php')
  return res.data
}
