import { get, postForm, fetchCsrfToken } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'

export async function login(password: string): Promise<void> {
  const fd = new FormData()
  fd.append('password', password)
  await postForm<ApiOk>('/api/teacher/login.php', fd)
  await fetchCsrfToken()
}

export async function logout(): Promise<void> {
  await get<ApiOk>('/api/teacher/logout.php')
}
