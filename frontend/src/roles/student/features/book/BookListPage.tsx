import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { stagger } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import type { BookListItem } from '@/shared/interactive-book'
import { bookApi } from './api'
import { BookCard } from './components/BookCard'

export const BookListPage: FC = () => {
  const [books, setBooks] = useState<BookListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    bookApi.getBookList()
      .then((data) => setBooks(data.books))
      .catch(() => setError('تعذّر تحميل الكتب. حاول مجدداً.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size="lg" /></div>
  if (error) return <p style={{ color: 'var(--danger)', padding: '2rem', textAlign: 'center' }}>{error}</p>

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '1.5rem' }}>كتبي</h1>
      {books.length === 0 ? (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem' }}>لا توجد كتب متاحة حالياً.</p>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}
        >
          {books.map((book) => <BookCard key={book.id} book={book} />)}
        </motion.div>
      )}
    </div>
  )
}
