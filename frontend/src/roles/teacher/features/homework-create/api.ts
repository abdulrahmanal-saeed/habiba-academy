import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { HomeworkPayload, HomeworkCreatedResponse } from './types'
import type { TeacherStudent } from '../students/types'

export async function getActiveStudents(): Promise<TeacherStudent[]> {
  const res = await get<ApiOk<{ students: TeacherStudent[] }>>('/api/teacher/students.php')
  return res.students.filter((s) => s.is_active)
}

export async function createHomework(payload: HomeworkPayload): Promise<HomeworkCreatedResponse> {
  const fd = new FormData()
  fd.append('student_id', String(payload.student_id))
  fd.append('title', payload.title)
  fd.append('hw_date', payload.hw_date)
  if (payload.publish_time) fd.append('publish_time', payload.publish_time)
  fd.append('status', payload.status)
  if (payload.media_url) fd.append('media_url', payload.media_url)
  if (payload.media_instructions) fd.append('media_instructions', payload.media_instructions)
  if (payload.reading_text) fd.append('reading_text', payload.reading_text)
  fd.append('mcq_questions', JSON.stringify(payload.mcq_questions))
  fd.append('writing_questions', JSON.stringify(payload.writing_questions))
  fd.append('speaking_questions', JSON.stringify(payload.speaking_questions))
  const res = await postForm<ApiOk<HomeworkCreatedResponse>>('/api/teacher/create-homework.php', fd)
  return res as unknown as HomeworkCreatedResponse
}

export async function updateHomework(homeworkId: number, payload: HomeworkPayload): Promise<HomeworkCreatedResponse> {
  const fd = new FormData()
  fd.append('homework_id', String(homeworkId))
  fd.append('student_id', String(payload.student_id))
  fd.append('title', payload.title)
  fd.append('hw_date', payload.hw_date)
  if (payload.publish_time) fd.append('publish_time', payload.publish_time)
  fd.append('status', payload.status)
  if (payload.media_url) fd.append('media_url', payload.media_url)
  if (payload.media_instructions) fd.append('media_instructions', payload.media_instructions)
  if (payload.reading_text) fd.append('reading_text', payload.reading_text)
  fd.append('mcq_questions', JSON.stringify(payload.mcq_questions))
  fd.append('writing_questions', JSON.stringify(payload.writing_questions))
  fd.append('speaking_questions', JSON.stringify(payload.speaking_questions))
  const res = await postForm<ApiOk<HomeworkCreatedResponse>>('/api/teacher/update-homework.php', fd)
  return res as unknown as HomeworkCreatedResponse
}
