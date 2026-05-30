import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { BuilderBook, BuilderLesson } from '../types'

interface Props {
  books: BuilderBook[]
  selectedLessonId: number | null
  onSelectLesson: (lesson: BuilderLesson, bookId: number) => void
  onDeleteLesson: (lessonId: number) => void
  onAddLesson: (bookId: number) => void
}

export const BookBuilderList: FC<Props> = ({
  books,
  selectedLessonId,
  onSelectLesson,
  onDeleteLesson,
  onAddLesson,
}) => {
  if (books.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
        No books found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {books.map((book) => (
        <div key={book.id}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>
                {book.title_en}
              </h3>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {book.level} · {book.lesson_count} lessons
              </span>
            </div>
          </div>

          <div className="space-y-1">
            {book.lessons.map((lesson) => (
              <motion.div
                key={lesson.id}
                whileHover={{ x: 2 }}
                className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                style={{
                  borderColor: selectedLessonId === lesson.id ? 'var(--accent)' : 'var(--border)',
                  background: selectedLessonId === lesson.id ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--card)',
                }}
                onClick={() => onSelectLesson(lesson, book.id)}
              >
                <span
                  className="w-7 text-center text-xs font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  {lesson.lesson_number}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {lesson.title_en}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {lesson.unit_type}
                    </span>
                    {lesson.has_content && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
                      >
                        Built
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson.id) }}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-red-50 hover:text-red-500"
                  style={{ color: 'var(--muted)' }}
                >
                  ✕
                </button>
              </motion.div>
            ))}

            <button
              onClick={() => onAddLesson(book.id)}
              className="w-full rounded-xl border border-dashed py-2 text-xs transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              + Add Lesson
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
