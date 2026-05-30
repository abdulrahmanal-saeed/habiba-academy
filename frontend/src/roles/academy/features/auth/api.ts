import { postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'

interface LoginAcademy { id: number; name: string }

export async function loginAcademy(accessCode: string): Promise<LoginAcademy> {
  const fd = new FormData()
  fd.append('access_code', accessCode)
  const res = await postForm<ApiOk<{ academy: LoginAcademy }>>('/api/academy/login.php', fd)
  return res.academy
}
