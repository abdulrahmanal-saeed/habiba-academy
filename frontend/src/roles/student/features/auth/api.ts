import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { LoginStudent } from './types'

export async function login(loginCode: string): Promise<LoginStudent> {
  const fd = new FormData()
  fd.append('login_code', loginCode)
  const res = await postForm<ApiOk<{ student: LoginStudent }>>('/api/student/login.php', fd)
  return res.student
}

export async function logout(): Promise<void> {
  await get<ApiOk>('/api/student/logout.php')
}
