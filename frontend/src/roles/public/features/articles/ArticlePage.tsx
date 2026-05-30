import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Calendar } from 'lucide-react'
import { fadeInUp, stagger } from '@/design-system/animations'
import { Button, Spinner } from '@/design-system/components'
import { STALE } from '@/core/lib/queryClient'
import { getArticle } from './api'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export const ArticlePage: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['public', 'article', slug],
    queryFn: () => getArticle(slug ?? ''),
    enabled: !!slug,
    staleTime: STALE.articles,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !article) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
        <p className="text-lg font-medium" style={{ color: 'var(--ink)' }}>المقال غير موجود</p>
        <Button variant="ghost" onClick={() => navigate('/articles')} leftIcon={<ArrowRight size={16} />}>
          العودة للمقالات
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-8">

          <motion.div variants={fadeInUp}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/articles')}
              leftIcon={<ArrowRight size={16} />}
              className="mb-6"
            >
              العودة للمقالات
            </Button>

            <span
              className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {article.category}
            </span>

            <h1 className="mb-4 text-3xl font-bold leading-snug md:text-4xl" style={{ color: 'var(--ink)' }}>
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--muted)' }}>
              <span className="font-medium" style={{ color: 'var(--ink-soft)' }}>{article.authorName}</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {article.readingTimeMinutes} دقائق قراءة
              </span>
            </div>
          </motion.div>

          {article.coverUrl && (
            <motion.img
              variants={fadeInUp}
              src={article.coverUrl}
              alt={article.title}
              className="w-full rounded-[var(--radius-lg)] object-cover"
              style={{ maxHeight: '400px', boxShadow: 'var(--shadow-md)' }}
            />
          )}

          <motion.div
            variants={fadeInUp}
            className="prose prose-lg max-w-none"
            style={{ color: 'var(--ink-soft)' }}
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          <motion.div
            variants={fadeInUp}
            className="rounded-[var(--radius-lg)] p-6 text-center"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
          >
            <p className="mb-4 font-semibold" style={{ color: 'var(--ink)' }}>
              هل أنت مستعد لتعلم العربية مع أستاذة متخصصة؟
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate('/level-test')}>
              ابدأ اختبار المستوى مجاناً
            </Button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}

export default ArticlePage
