import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { FlashCard, CardType, ReviewState } from './types'

export async function getFlashcards(): Promise<FlashCard[]> {
  const res = await get<ApiOk<{ items: FlashCard[] }>>('/api/student/flashcards.php')
  return res.items
}

export async function reviewCard(
  type: CardType,
  id: number,
  state: ReviewState,
): Promise<void> {
  const fd = new FormData()
  fd.append('type', type)
  fd.append('id', String(id))
  fd.append('state', state)
  await postForm<{ ok: boolean }>('/api/student/flashcard-review.php', fd)
}
