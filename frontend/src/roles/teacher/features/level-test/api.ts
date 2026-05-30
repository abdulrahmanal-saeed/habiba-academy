import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type {
  LevelTestAttempt,
  LevelTestGradePayload,
  LTBlock,
  LTBlockSavePayload,
  LTQuestionSavePayload,
  QuickBlock,
  QuickQuestion,
} from './types'

interface AttemptsResponse {
  attempts: LevelTestAttempt[]
  total: number
  pending_count: number
}

interface GradeResponse {
  attempt_id: number
  total_score: number
  overall_pct: number
  final_level: string
}

interface BankDataResponse {
  blocks: LTBlock[]
}

interface BlockSaveResponse {
  id: number
  action: string
}

interface QuestionSaveResponse {
  id: number
  variant?: number
  action: string
}

interface QuickBlockSaveResponse {
  block_id: number
}

export const levelTestApi = {
  getAttempts: (status: 'pending' | 'reviewed' | 'all' = 'all', limit = 50, offset = 0) =>
    apiClient.get<ApiOk<AttemptsResponse>>(
      `/api/teacher/leveltest-attempts.php?status=${status}&limit=${limit}&offset=${offset}`,
    ),

  gradeAttempt: (payload: LevelTestGradePayload) =>
    apiClient.postForm<ApiOk<GradeResponse>>('/api/teacher/leveltest-review-save.php', payload),

  sendResultEmail: (attemptId: number) =>
    apiClient.postForm<ApiOk<{ sent_to: string }>>('/api/teacher/send-result-email.php', {
      attempt_id: attemptId,
    }),

  getExportUrl: () => '/api/teacher/export-leveltest.php',

  getBankData: () =>
    apiClient.get<ApiOk<BankDataResponse>>('/api/teacher/leveltest-bank-data.php'),

  saveBlock: (payload: LTBlockSavePayload) =>
    apiClient.postForm<ApiOk<BlockSaveResponse>>('/api/teacher/lt-block-save.php', payload),

  saveQuestion: (payload: LTQuestionSavePayload) =>
    apiClient.postForm<ApiOk<QuestionSaveResponse>>('/api/teacher/lt-question-save.php', payload),

  deleteQuestion: (id: number) =>
    apiClient.postForm<ApiOk<{ deleted: number }>>('/api/teacher/lt-delete.php', { id }),

  uploadMedia: (formData: FormData) =>
    apiClient.postForm<ApiOk<{ path: string; url: string }>>('/api/teacher/lt-media-upload.php', formData),

  saveQuickBlock: (payload: {
    block_id: number
    passage_ar: string
    sort_order: number
    is_active: number
    questions: QuickQuestion[]
  }) =>
    apiClient.postForm<ApiOk<QuickBlockSaveResponse>>('/api/teacher/quick-block-save.php', {
      ...payload,
      questions: JSON.stringify(payload.questions),
    }),

  deleteQuickBlock: (blockId: number) =>
    apiClient.postForm<ApiOk<Record<string, never>>>('/api/teacher/quick-block-delete.php', {
      block_id: blockId,
    }),

  getQuickBlocks: () =>
    apiClient.get<ApiOk<{ blocks: QuickBlock[] }>>('/api/teacher/leveltest-bank-data.php'),
}
