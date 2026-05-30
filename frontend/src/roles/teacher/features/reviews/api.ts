import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type {
  ReviewListItem,
  ReviewCreatePayload,
  ReviewUpdatePayload,
  ReviewGradePayload,
  ReviewSubmissionPayload,
} from './types'

export const reviewsApi = {
  getStudentReviews: (studentId: number) =>
    apiClient.get<ApiOk<{ items: ReviewListItem[] }>>(
      `/api/review/student-list.php?student_id=${studentId}`
    ),

  createReview: (payload: ReviewCreatePayload) =>
    apiClient.postForm<ApiOk<{ review_id: number; title: string; publish_at: string | null; effective_status: string }>>(
      '/api/review/create.php',
      payload as unknown as Record<string, string | number>
    ),

  updateReview: (payload: ReviewUpdatePayload) =>
    apiClient.postForm<ApiOk<{ review_id: number; title: string; publish_at: string | null; effective_status: string }>>(
      '/api/review/update.php',
      payload as unknown as Record<string, string | number>
    ),

  gradeReview: (payload: ReviewGradePayload) =>
    apiClient.postForm<ApiOk<{ submission_id: number; auto_score: number; manual_score: number; total_score: number; total_points: number }>>(
      '/api/review/save.php',
      payload as unknown as Record<string, string | number>
    ),

  deleteReview: (reviewId: number) =>
    apiClient.postForm<ApiOk<Record<string, never>>>(
      '/api/review/delete.php',
      { review_id: reviewId }
    ),

  forceDeleteReview: (id: number) =>
    apiClient.postForm<ApiOk<Record<string, never>>>(
      '/api/teacher/review-delete.php',
      { id }
    ),

  getSubmission: (submissionId: number) =>
    apiClient.get<ApiOk<ReviewSubmissionPayload>>(
      `/api/teacher/review-submission.php?submission_id=${submissionId}`
    ),
}
