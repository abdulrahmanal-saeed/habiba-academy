import { motion } from 'framer-motion'
import type { FC } from 'react'
import { ArrowRight, Clock } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useHelpArticle } from '../useHelpCenter'

export interface HelpArticleViewProps {
  slug: string
  onBack: () => void
}

export const HelpArticleView: FC<HelpArticleViewProps> = ({ slug, onBack }) => {
  const { data: article, isLoading } = useHelpArticle(slug)

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!article) return null

  const updatedDate = new Date(article.updatedAt).toLocaleDateString('ar-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70 self-start"
        style={{ color: 'var(--accent)' }}
      >
        <ArrowRight size={16} />
        <span>العودة</span>
      </button>

      <div
        className="rounded-[var(--radius-xl)] p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border-soft)' }}
      >
        <div className="mb-2 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          {article.category}
        </div>
        <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--ink)' }}>
          {article.title}
        </h2>
        <div className="mb-6 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <Clock size={12} />
          <span>آخر تحديث: {updatedDate}</span>
        </div>
        <div
          className="prose prose-sm max-w-none text-sm leading-relaxed"
          style={{ color: 'var(--ink-soft)' }}
          dir="rtl"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </div>
    </motion.div>
  )
}
