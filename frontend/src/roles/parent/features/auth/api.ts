import { postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'

interface LoginParent { id: number; name: string }

export async function loginParent(accessCode: string): Promise<LoginParent> {
  const fd = new FormData()
  fd.append('access_code', accessCode)
  const res = await postForm<ApiOk<{ parent: LoginParent }>>('/api/parent/login.php', fd)
  return res.parent
}
