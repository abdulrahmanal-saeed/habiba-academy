import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { Homework, SubmitResult } from './types'

export async function getHomework(id: number): Promise<Homework> {
  const res = await get<ApiOk<{ data: Homework }>>(`/api/student/homework.php?homework_id=${id}`)
  return res.data
}

export async function submitHomework(
  homeworkId: number,
  mcq: Record<string, string>,
  writing: Record<string, string>,
  speaking: Record<string, Blob>,
): Promise<SubmitResult> {
  const fd = new FormData()
  fd.append('homework_id', String(homeworkId))

  for (const [qid, ans] of Object.entries(mcq)) {
    fd.append(`mcq[${qid}]`, ans)
  }
  for (const [qid, text] of Object.entries(writing)) {
    if (text.trim()) fd.append(`writing[${qid}]`, text)
  }
  for (const [qid, blob] of Object.entries(speaking)) {
    const ext = blob.type === 'audio/mp4' ? 'mp4' : 'webm'
    fd.append(`speaking[${qid}]`, blob, `sp_${qid}.${ext}`)
  }

  const res = await postForm<ApiOk<{ mcq_score: number; mcq_total: number }>>(
    '/api/student/submit-homework.php',
    fd,
  )
  return { mcqScore: res.mcq_score, mcqTotal: res.mcq_total }
}
