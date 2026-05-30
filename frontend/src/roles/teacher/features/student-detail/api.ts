import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type {
  StudentDetail,
  SubmissionItem,
  WeakWord,
  Mistake,
  ScenarioRecording,
  CourseMaterial,
  ScheduleSlot,
  AIAnalysis,
  StudentBookSubmission,
} from './types'

export async function getStudentDetail(studentId: number): Promise<StudentDetail> {
  const res = await get<ApiOk<StudentDetail>>(`/api/teacher/student-detail.php?student_id=${studentId}`)
  return res as unknown as StudentDetail
}

export async function getSubmissions(studentId: number): Promise<SubmissionItem[]> {
  const res = await get<ApiOk<{ submissions: SubmissionItem[] }>>(`/api/teacher/student-submissions.php?student_id=${studentId}`)
  return res.submissions
}

export async function getWeakWords(studentId: number): Promise<WeakWord[]> {
  const res = await get<ApiOk<{ words: WeakWord[] }>>(`/api/teacher/student-weak-words.php?student_id=${studentId}`)
  return res.words
}

export async function addWeakWord(studentId: number, word: string, note: string): Promise<{ id: number; word: string; note: string }> {
  const fd = new FormData()
  fd.append('student_id', String(studentId))
  fd.append('word', word)
  fd.append('note', note)
  const res = await postForm<ApiOk<{ id: number; word: string; note: string }>>('/api/teacher/save-weak-words.php', fd)
  return res as unknown as { id: number; word: string; note: string }
}

export async function getMistakes(studentId: number): Promise<Mistake[]> {
  const res = await get<ApiOk<{ mistakes: Mistake[] }>>(`/api/teacher/student-mistakes.php?student_id=${studentId}`)
  return res.mistakes
}

export async function addMistake(studentId: number, mistakeTag: string, note: string): Promise<{ id: number; mistake_tag: string; note: string }> {
  const fd = new FormData()
  fd.append('student_id', String(studentId))
  fd.append('mistake_tag', mistakeTag)
  fd.append('note', note)
  const res = await postForm<ApiOk<{ id: number; mistake_tag: string; note: string }>>('/api/teacher/save-mistakes.php', fd)
  return res as unknown as { id: number; mistake_tag: string; note: string }
}

export async function getConversations(studentId: number): Promise<ScenarioRecording[]> {
  const res = await get<ApiOk<{ conversations: ScenarioRecording[] }>>(`/api/teacher/student-conversations.php?student_id=${studentId}`)
  return res.conversations
}

export async function getMaterials(studentId: number): Promise<CourseMaterial[]> {
  const res = await get<ApiOk<{ items: CourseMaterial[] }>>(`/api/teacher/student-materials.php?student_id=${studentId}`)
  return res.items
}

export async function getSchedule(studentId: number): Promise<ScheduleSlot[]> {
  const res = await get<ApiOk<{ schedules: ScheduleSlot[] }>>(`/api/teacher/student-schedule.php?student_id=${studentId}`)
  return res.schedules
}

export async function saveScheduleDay(
  studentId: number,
  dayOfWeek: number,
  sessionTime: string,
  durationMinutes: number,
  priceOverride: number | null,
  isActive: boolean,
): Promise<void> {
  const fd = new FormData()
  fd.append('student_id', String(studentId))
  fd.append('day_of_week', String(dayOfWeek))
  fd.append('session_time', sessionTime)
  fd.append('duration_minutes', String(durationMinutes))
  if (priceOverride !== null) fd.append('price_override', String(priceOverride))
  fd.append('is_active', isActive ? '1' : '0')
  await postForm('/api/teacher/student-schedule.php', fd)
}

export async function generateMonthSessions(
  studentId: number,
  month: string,
): Promise<{ created: number; updated: number; skipped_duplicates: number; skipped_conflicts: number }> {
  const fd = new FormData()
  fd.append('student_id', String(studentId))
  fd.append('month', month)
  const res = await postForm<ApiOk<{ created: number; updated: number; skipped_duplicates: number; skipped_conflicts: number }>>('/api/teacher/generate-month-sessions.php', fd)
  return res as unknown as { created: number; updated: number; skipped_duplicates: number; skipped_conflicts: number }
}

export async function analyzeStudent(studentId: number, extraContext = ''): Promise<AIAnalysis> {
  const params = new URLSearchParams({ student_id: String(studentId) })
  if (extraContext) params.set('extra_context', extraContext)
  const res = await get<ApiOk<AIAnalysis>>(`/api/teacher/ai/analyze-student.php?${params.toString()}`)
  return res as unknown as AIAnalysis
}

export async function getBookSubmissions(studentId: number): Promise<StudentBookSubmission[]> {
  const res = await get<ApiOk<{ submissions: StudentBookSubmission[] }>>(`/api/teacher/book-submissions.php?student_id=${studentId}`)
  return res.submissions
}

export async function deleteHomework(homeworkId: number): Promise<void> {
  const fd = new FormData()
  fd.append('id', String(homeworkId))
  await postForm('/api/teacher/homework-delete.php', fd)
}
