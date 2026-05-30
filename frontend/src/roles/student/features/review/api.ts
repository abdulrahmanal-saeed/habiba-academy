import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { Review, ReviewResult, SubmitReviewResult } from './types'

export async function getReview(id: number): Promise<Review> {
  const res = await get<ApiOk<{ data: Review }>>(`/api/student/review.php?review_id=${id}`)
  return res.data
}

export async function getReviewResult(id: number): Promise<ReviewResult> {
  const res = await get<ApiOk<{ data: ReviewResult }>>(`/api/student/review-result.php?review_id=${id}`)
  return res.data
}

export async function submitReview(
  reviewId: number,
  mcq: Record<string, string>,
  matching: Record<string, Record<string, string>>,
  fillTheBlank: Record<string, string>,
  writing: Record<string, string>,
  speaking: Record<string, Blob>,
  scenario: Record<string, Blob>,
): Promise<SubmitReviewResult> {
  const fd = new FormData()
  fd.append('review_id', String(reviewId))

  for (const [qid, ans] of Object.entries(mcq)) {
    fd.append(`mcq[${qid}]`, ans)
  }
  for (const [exId, pairs] of Object.entries(matching)) {
    for (const [leftId, rightId] of Object.entries(pairs)) {
      fd.append(`matching[${exId}][${leftId}]`, rightId)
    }
  }
  for (const [qid, text] of Object.entries(fillTheBlank)) {
    fd.append(`fill_the_blank[${qid}]`, text)
  }
  for (const [qid, text] of Object.entries(writing)) {
    fd.append(`writing[${qid}]`, text)
  }
  for (const [qid, blob] of Object.entries(speaking)) {
    const ext = blob.type === 'audio/mp4' ? 'mp4' : 'webm'
    fd.append(`speaking__${qid}`, blob, `speaking__${qid}.${ext}`)
  }
  for (const [qid, blob] of Object.entries(scenario)) {
    const ext = blob.type === 'audio/mp4' ? 'mp4' : 'webm'
    fd.append(`scenario__${qid}`, blob, `scenario__${qid}.${ext}`)
  }

  const res = await postForm<ApiOk<SubmitReviewResult>>('/api/review/submit.php', fd)
  return { review_id: res.review_id, submission_id: res.submission_id, auto_score: res.auto_score }
}
