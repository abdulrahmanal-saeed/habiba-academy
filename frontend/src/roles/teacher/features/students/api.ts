import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { TeacherStudent } from './types'

export async function getStudents(): Promise<TeacherStudent[]> {
  const res = await get<ApiOk<{ students: TeacherStudent[] }>>('/api/teacher/students.php')
  return res.students
}
