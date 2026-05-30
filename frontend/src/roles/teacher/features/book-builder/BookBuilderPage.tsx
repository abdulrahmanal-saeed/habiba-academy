import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { bookBuilderApi } from './api'
import type { BuilderBook, BuilderLesson, BuilderSection, SaveLessonPayload } from './types'
import { BookBuilderList } from './components/BookBuilderList'
import { LessonBuilderForm } from './components/LessonBuilderForm'

interface ActiveLesson {
  lesson: BuilderLesson
  bookId: number
  sections: BuilderSection[]
  titleEn: string
  titleAr: string
  status: string
  unitType: string
}

const NEW_LESSON = (bookId: number): ActiveLesson => ({
  lesson: {
    id: 0,
    lesson_number: 0,
    unit_type: 'lesson',
    title_en: '',
    title_ar: '',
    slug: '',
    status: 'draft',
    has_content: false,
  },
  bookId,
  sections: [],
  titleEn: '',
  titleAr: '',
  status: 'draft',
  unitType: 'lesson',
})

export const BookBuilderPage: FC = () => {
  const [books, setBooks] = useState<BuilderBook[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<ActiveLesson | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    bookBuilderApi.getBooks()
      .then((d) => setBooks(d.books))
      .catch(() => {/* silently */})
      .finally(() => setLoading(false))
  }, [])

  const refresh = () =>
    bookBuilderApi.getBooks().then((d) => setBooks(d.books)).catch(() => {/* */})

  const handleSelectLesson = (lesson: BuilderLesson, bookId: number) => {
    setContentLoading(true)
    bookBuilderApi.getLesson(lesson.id)
      .then((d) => {
        const rawContent = d.content
        const sections: BuilderSection[] = Array.isArray(rawContent?.sections)
          ? (rawContent.sections as BuilderSection[])
          : []
        setActive({
          lesson: d.lesson,
          bookId,
          sections,
          titleEn: d.lesson.title_en,
          titleAr: d.lesson.title_ar,
          status: d.lesson.status,
          unitType: d.lesson.unit_type,
        })
      })
      .catch(() => setSaveMsg('Failed to load lesson'))
      .finally(() => setContentLoading(false))
  }

  const handleAddLesson = (bookId: number) => {
    setActive(NEW_LESSON(bookId))
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return
    await bookBuilderApi.deleteLesson(lessonId)
    if (active?.lesson.id === lessonId) setActive(null)
    await refresh()
  }

  const handleSave = async () => {
    if (!active) return
    setSaving(true)
    setSaveMsg('')
    try {
      const payload: SaveLessonPayload = {
        title_en: active.titleEn,
        title_ar: active.titleAr,
        status: active.status,
        unit_type: active.unitType,
        content: { sections: active.sections },
      }
      if (active.lesson.id) {
        payload.lesson_id = active.lesson.id
      } else {
        payload.book_id = active.bookId
      }
      const res = await bookBuilderApi.saveLesson(payload)
      setSaveMsg('Saved!')
      if (res.created) {
        await refresh()
        // Re-select the new lesson
        const freshBooks = await bookBuilderApi.getBooks()
        setBooks(freshBooks.books)
        const book = freshBooks.books.find((b) => b.id === active.bookId)
        const newLesson = book?.lessons.find((l) => l.id === res.lesson_id)
        if (newLesson) handleSelectLesson(newLesson, active.bookId)
      } else {
        await refresh()
      }
    } catch {
      setSaveMsg('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">
      {/* Sidebar — book + lesson list */}
      <div
        className="w-72 shrink-0 overflow-y-auto border-e p-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--text)' }}>
          Book Builder
        </h2>
        <BookBuilderList
          books={books}
          selectedLessonId={active?.lesson.id ?? null}
          onSelectLesson={handleSelectLesson}
          onDeleteLesson={handleDeleteLesson}
          onAddLesson={handleAddLesson}
        />
      </div>

      {/* Editor panel */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
        {contentLoading && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        )}

        {!contentLoading && !active && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Select a lesson or click "Add Lesson" to start building.
            </p>
          </div>
        )}

        {!contentLoading && active && (
          <motion.div
            key={active.lesson.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-6"
          >
            {/* Lesson meta */}
            <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>
                {active.lesson.id ? 'Edit Lesson' : 'New Lesson'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Title (EN)
                  </label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    value={active.titleEn}
                    onChange={(e) => setActive({ ...active, titleEn: e.target.value })}
                    placeholder="Lesson title"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Title (AR)
                  </label>
                  <input
                    dir="rtl"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    value={active.titleAr}
                    onChange={(e) => setActive({ ...active, titleAr: e.target.value })}
                    placeholder="عنوان الدرس"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Unit Type
                  </label>
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    value={active.unitType}
                    onChange={(e) => setActive({ ...active, unitType: e.target.value })}
                  >
                    <option value="lesson">Lesson</option>
                    <option value="unit">Unit</option>
                    <option value="review">Review</option>
                    <option value="test">Test</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Status
                  </label>
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    value={active.status}
                    onChange={(e) => setActive({ ...active, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section builder */}
            <div>
              <h4 className="mb-3 font-semibold text-sm" style={{ color: 'var(--text)' }}>
                Sections ({active.sections.length})
              </h4>
              <LessonBuilderForm
                sections={active.sections}
                onChange={(sections) => setActive({ ...active, sections })}
              />
            </div>

            {/* Save bar */}
            <div className="flex items-center gap-4 pb-8">
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {saving ? 'Saving…' : 'Save Lesson'}
              </button>
              {saveMsg && (
                <span
                  className="text-sm font-medium"
                  style={{ color: saveMsg.includes('fail') ? '#ef4444' : 'var(--accent)' }}
                >
                  {saveMsg}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
