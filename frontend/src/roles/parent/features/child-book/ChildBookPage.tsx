import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, Lock } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { useChildBook } from './hooks/useChildBook'
import { pageVariant, stagger, cardVariant } from './animations'
import type { ChildBookItem } from './types'

function BookCard({ book }: { book: ChildBookItem }) {
  const locked = book.access_status === 'locked'

  return (
    <motion.div
      variants={cardVariant}
      whileHover={locked ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-2xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: locked ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{book.title_ar}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{book.title_en} · {book.level}</p>
        </div>
        {locked ? (
          <Lock size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        ) : (
          <BookOpen size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        )}
      </div>

      {!locked && (
        <>
          <div
            className="h-2 w-full rounded-full overflow-hidden mb-2"
            style={{ background: 'var(--border)' }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${book.progress_pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: 'var(--accent)' }}
            />
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
            <span>{book.done_lessons} / {book.total_lessons} درس</span>
            <span className="font-bold" style={{ color: 'var(--accent)' }}>{book.progress_pct}%</span>
          </div>
        </>
      )}

      {locked && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>الكتاب غير مفعَّل لهذا الطالب.</p>
      )}
    </motion.div>
  )
}

export const ChildBookPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const childId = parseInt(id ?? '0', 10)
  const { data, isLoading, error } = useChildBook(childId)

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>تعذّر تحميل بيانات الكتاب.</p>
      </div>
    )
  }

  const { child, books } = data
  const unlocked = books.filter((b) => b.access_status !== 'locked').length

  return (
    <motion.div variants={pageVariant} initial="hidden" animate="visible" className="flex flex-col gap-5">
      <Link to="/parent" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
        ← العودة
      </Link>

      <div
        className="flex items-start justify-between gap-3 rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{child.full_name}</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{child.level}</p>
        </div>
        <p className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>
          {unlocked} كتاب مفعَّل
        </p>
      </div>

      {books.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>لا توجد كتب بعد.</p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2">
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </motion.div>
      )}
    </motion.div>
  )
}
