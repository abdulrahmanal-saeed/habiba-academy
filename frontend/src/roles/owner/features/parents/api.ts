import { apiClient } from '@/core/lib/apiClient'
import type {
  Parent, StudentOption,
  ParentListResponse, StudentOptionsResponse, ParentActionResponse, ParentSavePayload,
} from './types'

const URL = '/api/owner/parents'

export function getParents(): Promise<Parent[]> {
  return apiClient.get<ParentListResponse>(URL).then((r) => r.data.parents)
}

export function getStudentOptions(): Promise<StudentOption[]> {
  return apiClient.get<StudentOptionsResponse>(URL, { params: { action: 'students' } })
    .then((r) => r.data.students)
}

export function saveParent(payload: ParentSavePayload): Promise<ParentActionResponse['data']> {
  return apiClient.post<ParentActionResponse>(URL, payload as unknown as Record<string, unknown>)
    .then((r) => r.data)
}

export function deleteParent(id: number): Promise<ParentActionResponse['data']> {
  return apiClient.post<ParentActionResponse>(URL, { action: 'delete', id }).then((r) => r.data)
}
