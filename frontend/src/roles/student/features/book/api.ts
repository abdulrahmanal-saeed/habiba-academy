import { apiClient } from '@/core/lib/apiClient'
import type { BookListData, BookViewData, BookLessonData, FeedbackPageData, DraftResult, SubmitResult } from '@/shared/interactive-book'

export const bookApi = {
  getBookList: () =>
    apiClient.get<BookListData>('/api/student/book-list.php'),

  getBookView: (bookId: number) =>
    apiClient.get<BookViewData>(`/api/student/book-view.php?book_id=${bookId}`),

  getLesson: (lessonId: number) =>
    apiClient.get<BookLessonData>(`/api/student/book-lesson.php?lesson_id=${lessonId}`),

  getFeedback: (submissionId: number) =>
    apiClient.get<FeedbackPageData>(`/api/student/book-feedback.php?submission_id=${submissionId}`),

  saveDraft: (fd: FormData) =>
    apiClient.postForm<DraftResult>('/api/student/book-save-draft.php', fd),

  submitLesson: (fd: FormData) =>
    apiClient.postForm<SubmitResult>('/api/student/book-submit-lesson.php', fd),

  trackAudio: (lessonId: number, key: string): void => {
    const fd = new FormData()
    fd.append('lesson_id', String(lessonId))
    fd.append('audio_key', key)
    void apiClient.postForm('/api/student/book-audio-activity.php', fd)
  },

  addWeakWord: (word: string): void => {
    const fd = new FormData()
    fd.append('word', word)
    void apiClient.postForm('/api/student/book-add-weak-word.php', fd)
  },
}
