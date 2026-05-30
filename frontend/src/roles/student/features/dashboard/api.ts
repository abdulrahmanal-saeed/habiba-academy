import { get, post } from '@/core/lib/apiClient'
import type {
  NotificationsData,
  Submission,
  Conversation,
  Achievement,
  WeeklySummary,
  WeakWord,
  Mistake,
  Material,
} from './types'

type ApiOk<T> = { ok: true; data: T }

export async function fetchNotifications(): Promise<NotificationsData> {
  const res = await get<ApiOk<NotificationsData>>('/api/student/notifications.php')
  return res.data
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const res = await get<ApiOk<Submission[]>>('/api/student/submissions.php')
  return res.data
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await get<ApiOk<Conversation[]>>('/api/student/conversations.php')
  return res.data
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const res = await get<ApiOk<Achievement[]>>('/api/student/achievements.php')
  return res.data
}

export async function fetchWeeklySummary(): Promise<WeeklySummary> {
  const res = await get<ApiOk<WeeklySummary>>('/api/student/weekly-summary.php')
  return res.data
}

export async function fetchWeakWords(): Promise<WeakWord[]> {
  const res = await get<ApiOk<WeakWord[]>>('/api/student/weak-words.php')
  return res.data
}

export async function fetchMistakes(): Promise<Mistake[]> {
  const res = await get<ApiOk<Mistake[]>>('/api/student/common-mistakes.php')
  return res.data
}

export async function fetchMaterials(): Promise<Material[]> {
  const res = await get<ApiOk<Material[]>>('/api/student/materials.php')
  return res.data
}

export async function toggleWeakWord(weakWordId: number, isMastered: boolean): Promise<void> {
  await post('/api/student/toggle-weak-word.php', {
    weak_word_id: weakWordId,
    is_mastered: isMastered ? '1' : '0',
  })
}

export async function toggleMistake(mistakeId: number, isMastered: boolean): Promise<void> {
  await post('/api/student/toggle-mistake.php', {
    mistake_id: mistakeId,
    is_mastered: isMastered ? '1' : '0',
  })
}

export async function bookMarketingEvent(eventKey: string, eventValue: string): Promise<void> {
  await post('/api/book-marketing-event.php', { event_key: eventKey, event_value: eventValue })
}
