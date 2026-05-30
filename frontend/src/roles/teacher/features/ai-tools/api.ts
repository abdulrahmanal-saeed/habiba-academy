import { get, post, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type {
  AIAnalysis,
  AIHomework,
  AIScenario,
  AILesson,
  AISession,
  AIArticle,
  AIWritingAssist,
  MistakeSuggestion,
  ReviewPriorityItem,
  SuggestionActionPayload,
  MistakeEventPayload,
  InternalNotePayload,
  WritingAssistPayload,
} from './types'

export const aiToolsApi = {
  // Group A: Governance (rate-limited, Claude API)
  async analyzeStudent(studentId: number, extraContext = ''): Promise<{ analysis: AIAnalysis; ai_request_id: number }> {
    const p = new URLSearchParams({ student_id: String(studentId) })
    if (extraContext) p.set('extra_context', extraContext)
    const res = await get<ApiOk<{ analysis: AIAnalysis; ai_request_id: number }>>(`/api/teacher/ai/analyze-student.php?${p}`)
    return { analysis: res.analysis, ai_request_id: res.ai_request_id }
  },

  async generateHomework(payload: {
    student_id: number; analysis?: AIAnalysis | null; sections?: string[]; lesson_focus?: string; extra_context?: string
  }): Promise<{ homework: AIHomework; ai_request_id: number }> {
    const res = await post<ApiOk<{ homework: AIHomework; ai_request_id: number }>>('/api/teacher/ai/homework.php', payload)
    return { homework: res.homework, ai_request_id: res.ai_request_id }
  },

  async generateScenario(payload: {
    student_id: number; analysis?: AIAnalysis | null; topic?: string; extra_context?: string
  }): Promise<{ scenario: AIScenario; ai_request_id: number }> {
    const res = await post<ApiOk<{ scenario: AIScenario; ai_request_id: number }>>('/api/teacher/ai/scenario.php', payload)
    return { scenario: res.scenario, ai_request_id: res.ai_request_id }
  },

  async prepareLesson(payload: {
    student_id: number; analysis?: AIAnalysis | null; session_number?: number; extra_context?: string
  }): Promise<{ lesson: AILesson; ai_request_id: number }> {
    const res = await post<ApiOk<{ lesson: AILesson; ai_request_id: number }>>('/api/teacher/ai/lesson.php', payload)
    return { lesson: res.lesson, ai_request_id: res.ai_request_id }
  },

  async planSessions(params: {
    student_id: number; only_empty?: number; count?: number; extra_context?: string
  }): Promise<{ sessions: AISession[]; ai_request_id: number }> {
    const p = new URLSearchParams({ student_id: String(params.student_id) })
    if (params.only_empty !== undefined) p.set('only_empty', String(params.only_empty))
    if (params.count) p.set('count', String(params.count))
    if (params.extra_context) p.set('extra_context', params.extra_context)
    const res = await get<ApiOk<{ sessions: AISession[]; ai_request_id: number }>>(`/api/teacher/ai/sessions.php?${p}`)
    return { sessions: res.sessions, ai_request_id: res.ai_request_id }
  },

  async generateArticle(payload: {
    article_type?: string; audience?: string; keywords?: string; notes?: string; language?: string
  }): Promise<{ article: AIArticle; ai_request_id: number }> {
    const res = await post<ApiOk<{ article: AIArticle; ai_request_id: number }>>('/api/teacher/ai/article.php', payload)
    return { article: res.article, ai_request_id: res.ai_request_id }
  },

  // Group B: Data-only
  async getReviewPriority(limit = 20): Promise<ReviewPriorityItem[]> {
    const res = await get<ApiOk<{ items: ReviewPriorityItem[] }>>(`/api/teacher/ai/review-priority.php?limit=${limit}`)
    return res.items
  },

  // Group C: Rule-based (POST form)
  async getMistakeTags(studentId: number, text: string): Promise<{ suggestions: MistakeSuggestion[]; ai_request_id: number }> {
    const res = await postForm<ApiOk<{ suggestions: MistakeSuggestion[]; ai_request_id: number }>>(
      '/api/teacher/ai/mistake-tags.php', { student_id: studentId, text }
    )
    return { suggestions: res.suggestions, ai_request_id: res.ai_request_id }
  },

  // Group D: Direct Claude (POST form, graceful fallback)
  async getWritingAssist(payload: WritingAssistPayload): Promise<{ assist: AIWritingAssist; ai_request_id: number; cached: boolean }> {
    const res = await postForm<ApiOk<{ assist: AIWritingAssist; ai_request_id: number; cached: boolean }>>(
      '/api/teacher/ai/writing-assist.php', payload as unknown as Record<string, unknown>
    )
    return { assist: res.assist, ai_request_id: res.ai_request_id, cached: res.cached }
  },

  // Group E: Data actions (fire-and-forget)
  async applyArticle(article: AIArticle, aiRequestId: number): Promise<{ id: number; slug: string; message: string }> {
    const res = await post<ApiOk<{ id: number; slug: string; message: string }>>(
      '/api/teacher/ai/apply-article.php', { article, ai_request_id: aiRequestId }
    )
    return { id: res.id, slug: res.slug, message: res.message }
  },

  async recordSuggestionAction(payload: SuggestionActionPayload): Promise<void> {
    await postForm('/api/teacher/ai/suggestion-action.php', payload as unknown as Record<string, unknown>)
  },

  async saveInternalNote(payload: InternalNotePayload): Promise<{ id: number }> {
    const res = await postForm<ApiOk<{ id: number }>>('/api/teacher/ai/internal-note.php', payload as unknown as Record<string, unknown>)
    return { id: res.id }
  },

  async recordMistakeEvent(payload: MistakeEventPayload): Promise<void> {
    await postForm('/api/teacher/ai/mistake-event.php', payload as unknown as Record<string, unknown>)
  },

  async deleteAnalysisHistory(id: number): Promise<void> {
    await postForm('/api/teacher/ai/delete-analysis-history.php', { id })
  },

  // Group F: Utility
  async testConnection(): Promise<{ ok: boolean; model: string; message: string }> {
    const res = await postForm<ApiOk<{ ok: boolean; model: string; message: string }>>('/api/teacher/ai/test-connection.php', {})
    return res as unknown as { ok: boolean; model: string; message: string }
  },
}
