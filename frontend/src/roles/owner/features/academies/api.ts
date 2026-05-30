import { apiClient } from '@/core/lib/apiClient'
import type {
  Academy, StudentOption,
  AcademyListResponse, StudentListResponse, AcademyActionResponse,
} from './types'

const URL = '/api/owner/academies'

export function getAcademies(): Promise<Academy[]> {
  return apiClient.get<AcademyListResponse>(URL).then((r) => r.data.academies)
}

export function getStudentOptions(): Promise<StudentOption[]> {
  return apiClient.get<StudentListResponse>(URL, { params: { action: 'students' } })
    .then((r) => r.data.students)
}

export function saveAcademy(form: FormData): Promise<AcademyActionResponse['data']> {
  return apiClient.postForm<AcademyActionResponse>(URL, form).then((r) => r.data)
}

export function deleteAcademy(academyId: number): Promise<AcademyActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'delete')
  fd.append('academy_id', String(academyId))
  return apiClient.postForm<AcademyActionResponse>(URL, fd).then((r) => r.data)
}
