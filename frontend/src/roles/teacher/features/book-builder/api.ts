import { apiClient } from '@/core/lib/apiClient'
import type {
  BooksListData,
  BuilderLessonData,
  SaveLessonPayload,
  SaveLessonResult,
} from './types'

export const bookBuilderApi = {
  getBooks: () =>
    apiClient.get<BooksListData>('/api/teacher/book-builder-list.php'),

  getLesson: (lessonId: number) =>
    apiClient.get<BuilderLessonData>(
      `/api/teacher/book-builder-lesson.php?lesson_id=${lessonId}`,
    ),

  saveLesson: (payload: SaveLessonPayload) =>
    apiClient.post<SaveLessonResult>('/api/teacher/book-builder-save.php', payload),

  deleteLesson: (lessonId: number) =>
    apiClient.post<{ deleted: string; lesson_id: number }>(
      '/api/teacher/book-builder-delete.php',
      { lesson_id: lessonId },
    ),

  deleteBook: (bookId: number) =>
    apiClient.post<{ deleted: string; book_id: number }>(
      '/api/teacher/book-builder-delete.php',
      { book_id: bookId },
    ),
}
