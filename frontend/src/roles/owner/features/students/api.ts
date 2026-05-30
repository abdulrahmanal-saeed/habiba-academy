import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { OwnerStudent } from './types'

/**
 * Owner shares the teacher session, so the owner roster reuses the
 * teacher students endpoint rather than duplicating backend logic.
 */
export async function getOwnerStudents(): Promise<OwnerStudent[]> {
  const res = await get<ApiOk<{ students: OwnerStudent[] }>>('/api/teacher/students.php')
  return res.students
}
