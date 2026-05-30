import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { CommonMistake } from './types'

export async function getCommonMistakes(): Promise<CommonMistake[]> {
  const res = await get<ApiOk<{ items: CommonMistake[] }>>('/api/student/common-mistakes.php')
  return res.items
}

export async function toggleMistake(id: number, isMastered: 0 | 1): Promise<void> {
  const fd = new FormData()
  fd.append('mistake_id', String(id))
  fd.append('is_mastered', String(isMastered))
  await postForm<ApiOk>('/api/student/toggle-mistake.php', fd)
}
