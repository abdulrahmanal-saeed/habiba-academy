import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { BookFeedbackPayload, BookSubmission, BookSubmissionDetail } from './types'

export const bookSubmissionsApi = {
  getSubmissions: (status?: string, q?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    const qs = params.toString()
    return apiClient.get<ApiOk<{ submissions: BookSubmission[] }>>(
      `/api/teacher/book-submissions.php${qs ? `?${qs}` : ''}`,
    )
  },

  getSubmissionDetail: (submissionId: number) =>
    apiClient.get<ApiOk<BookSubmissionDetail>>(
      `/api/teacher/book-submission-detail.php?submission_id=${submissionId}`,
    ),

  postFeedback: (payload: BookFeedbackPayload) =>
    apiClient.postForm<ApiOk<{ submission_id: number }>>(
      '/api/teacher/book-post-feedback.php',
      payload as unknown as Record<string, unknown>,
    ),
}
