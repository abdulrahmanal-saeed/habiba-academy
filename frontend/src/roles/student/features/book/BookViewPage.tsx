import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fadeInDown, stagger } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import type { BookViewData } from '@/shared/interactive-book'
import { bookApi } from './api'
import { LessonRow } from './components/LessonRow'

export const BookViewPage: FC = () => {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const id = Number(bookId)
  const [data, setData] = useState<BookViewData | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(!id ? 'معرّف الكتاب غير صحيح.' : '')

  useEffect(() => {
    if (!id) return
    bookApi.getBookView(id)
      .then(setData)
      .catch(() => setError('تعذّر تحميل الكتاب. حاول مجدداً.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size="lg" /></div>
  if (error || !data) return <p style={{ color: 'var(--danger)', padding: '2rem', textAlign: 'center' }}>{error || 'الكتاب غير موجود.'}</p>

  const { book, lessons, continue_lesson_id } = data

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <motion.div variants={fadeInDown} initial="hidden" animate="visible" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate('/student/book')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.875rem', padding: 0, marginBottom: '0.75rem' }}
        >
          ← كل الكتب
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--ink)', margin: 0, direction: 'rtl' }}>{book.title_ar}</h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', margin: '0.25rem 0 0' }}>{book.title_en} · {book.level}</p>
          </div>
        </div>
        {continue_lesson_id && (
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/student/book/${continue_lesson_id}`)}
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}
          >
            متابعة الدرس
          </motion.button>
        )}
      </motion.div>

      {lessons.length === 0 ? (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem' }}>لا توجد دروس متاحة في هذا الكتاب بعد.</p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} />)}
        </motion.div>
      )}
    </div>
  )
}
