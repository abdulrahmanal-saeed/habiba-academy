import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { WeakWord } from './types'

export async function getWeakWords(): Promise<WeakWord[]> {
  const res = await get<ApiOk<{ items: WeakWord[] }>>('/api/student/weak-words.php')
  return res.items
}

export async function toggleWeakWord(id: number, isMastered: 0 | 1): Promise<0 | 1> {
  const fd = new FormData()
  fd.append('weak_word_id', String(id))
  fd.append('is_mastered', String(isMastered))
  const res = await postForm<ApiOk<{ is_mastered: 0 | 1 }>>('/api/student/toggle-weak-word.php', fd)
  return res.is_mastered
}
