import { get, postForm } from '@/core/lib/apiClient'
import type {
  LessonPlanData,
  SessionSavePayload,
  SessionStatusPayload,
  ContractSavePayload,
} from './types'

type ApiOk<T = Record<string, never>> = { ok: true } & T

export async function getLessonPlan(studentId: number): Promise<LessonPlanData> {
  return get<LessonPlanData>('/api/teacher/lesson-plan-data.php', {
    params: { student_id: studentId },
  })
}

export async function saveSession(payload: SessionSavePayload): Promise<ApiOk> {
  const fd = new FormData()
  const entries = Object.entries(payload) as [string, string | number | undefined][]
  for (const [k, v] of entries) {
    if (v !== undefined) fd.append(k, String(v))
  }
  return postForm<ApiOk>('/api/teacher/session-save.php', fd)
}

export async function setSessionStatus(payload: SessionStatusPayload): Promise<ApiOk> {
  const fd = new FormData()
  const entries = Object.entries(payload) as [string, string | number | undefined][]
  for (const [k, v] of entries) {
    if (v !== undefined) fd.append(k, String(v))
  }
  return postForm<ApiOk>('/api/teacher/session-status.php', fd)
}

export async function saveContract(
  payload: ContractSavePayload,
): Promise<ApiOk<{ contract_id: number; total_sessions: number }>> {
  const fd = new FormData()
  const entries = Object.entries(payload) as [string, string | number | undefined][]
  for (const [k, v] of entries) {
    if (v !== undefined) fd.append(k, String(v))
  }
  return postForm<ApiOk<{ contract_id: number; total_sessions: number }>>(
    '/api/teacher/contract-save.php',
    fd,
  )
}
