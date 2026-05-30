import { useState } from 'react'
import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import { Button, Spinner } from '@/design-system/components'
import { STALE } from '@/core/lib/queryClient'
import { getArticles } from './api'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export const ArticlesListPage: FC = () => {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'articles', page],
    queryFn: () => getArticles(page),
    staleTime: STALE.articles,
  })

  return (
    <div className="min-h-screen py-16" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--ink)' }}>
            المقالات التعليمية
          </h1>
          <p className="text-lg" style={{ color: 'var(--muted)' }}>
            نصائح وموارد لتعلم اللغة العربية بشكل أسرع وأذكى
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid gap-6 sm:grid-cols-2"
            >
              {(data?.items ?? []).map((article) => (
                <motion.article
                  key={article.id}
                  variants={cardVariant}
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => navigate(`/articles/${article.slug}`)}
                  className="flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius-lg)]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}
                >
                  {article.coverUrl && (
                    <img
                      src={article.coverUrl}
                      alt={article.title}
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <span
                      className="w-fit rounded-full px-3 py-0.5 text-xs font-medium"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {article.category}
                    </span>
                    <h2 className="text-base font-bold leading-snug" style={{ color: 'var(--ink)' }}>
                      {article.title}
                    </h2>
                    <p className="line-clamp-2 text-sm" style={{ color: 'var(--muted)' }}>
                      {article.excerpt}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-xs" style={{ color: 'var(--muted-light)' }}>
                      <span>{formatDate(article.publishedAt)}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {article.readingTimeMinutes} د
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {/* Pagination */}
            {(data?.totalPages ?? 0) > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  leftIcon={<ChevronRight size={16} />}
                >
                  السابق
                </Button>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  {page} / {data?.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data?.totalPages}
                  rightIcon={<ChevronLeft size={16} />}
                >
                  التالي
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ArticlesListPage
