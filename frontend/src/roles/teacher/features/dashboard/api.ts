import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { TeacherDashboard } from './types'

export async function getTeacherDashboard(month?: string): Promise<TeacherDashboard> {
  const params = month ? `?month=${encodeURIComponent(month)}` : ''
  const res = await get<ApiOk<TeacherDashboard>>(`/api/teacher/home.php${params}`)
  return {
    kpis: res.kpis,
    today_homework: res.today_homework,
    today_scenarios: res.today_scenarios,
    today_reviews: res.today_reviews,
    priority_queue: res.priority_queue,
    calendar: res.calendar,
  }
}

export async function setItemStatus(
  type: 'homework' | 'scenario' | 'review',
  id: number,
  status: 'draft' | 'published' | 'closed',
): Promise<void> {
  const fd = new FormData()
  fd.append('type', type)
  fd.append('id', String(id))
  fd.append('status', status)
  await postForm<ApiOk>('/api/teacher/item-status.php', fd)
}
