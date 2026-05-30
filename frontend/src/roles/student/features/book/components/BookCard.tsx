import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardVariant, cardHover } from '@/design-system/animations'
import type { BookListItem } from '@/shared/interactive-book'

interface BookCardProps {
  book: BookListItem
}

export const BookCard: FC<BookCardProps> = ({ book }) => {
  const navigate = useNavigate()

  return (
    <motion.div
      variants={cardVariant}
      {...cardHover}
      onClick={() => navigate(`/student/book/view/${book.id}`)}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{book.title_ar}</h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: 9999, background: book.access_status === 'active' ? 'var(--success-soft)' : 'var(--muted-soft)', color: book.access_status === 'active' ? 'var(--success)' : 'var(--muted)' }}>
          {book.level}
        </span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>{book.title_en}</p>
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>التقدم</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>{book.progress_pct}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${book.progress_pct}%`, background: 'var(--accent)', borderRadius: 9999, transition: 'width 0.4s ease' }} />
        </div>
      </div>
      <button
        type="button"
        style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
      >
        {book.progress_pct > 0 ? 'متابعة' : 'ابدأ الآن'}
      </button>
    </motion.div>
  )
}
