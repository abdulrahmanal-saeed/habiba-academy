import { useState } from 'react'
import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { stagger, fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { STALE } from '@/core/lib/queryClient'
import { getHelpArticles } from './api'
import type { HelpArticle } from './types'

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)
  useState(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  })
  return debounced
}

const ArticleAccordion: FC<{ article: HelpArticle }> = ({ article }) => {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)]"
      style={{ border: '1px solid var(--border-soft)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-accent-soft"
        style={{ background: open ? 'var(--accent-soft)' : 'var(--card)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
          {article.title}
        </span>
        {open
          ? <ChevronUp size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        }
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-5 py-4 text-sm leading-relaxed"
              style={{
                color: 'var(--ink-soft)',
                background: 'var(--surface)',
                borderTop: '1px solid var(--border-soft)',
              }}
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const HelpPage: FC = () => {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 350)

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['help', 'articles', 'public', debounced],
    queryFn: () => getHelpArticles(debounced || undefined),
    staleTime: STALE.help,
  })

  const grouped = articles.reduce<Record<string, HelpArticle[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category]!.push(a)
    return acc
  }, {})

  return (
    <div className="min-h-screen py-16" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-10">

          <motion.div variants={fadeInUp} className="text-center">
            <HelpCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <h1 className="mb-2 text-3xl font-bold" style={{ color: 'var(--ink)' }}>مركز المساعدة</h1>
            <p style={{ color: 'var(--muted)' }}>ابحث عن إجابات لأسئلتك الشائعة</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="relative">
            <Search
              size={18}
              className="absolute start-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الأسئلة الشائعة..."
              className="w-full rounded-[var(--radius-lg)] py-3 pe-4 ps-12 text-sm outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
              }}
            />
          </motion.div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : articles.length === 0 ? (
            <motion.p variants={fadeInUp} className="text-center" style={{ color: 'var(--muted)' }}>
              لا توجد نتائج للبحث "{search}"
            </motion.p>
          ) : (
            <motion.div variants={stagger} className="flex flex-col gap-8">
              {Object.entries(grouped).map(([category, items]) => (
                <motion.section key={category} variants={fadeInUp}>
                  <h2
                    className="mb-4 text-sm font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--accent)' }}
                  >
                    {category}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {items.map((a) => <ArticleAccordion key={a.id} article={a} />)}
                  </div>
                </motion.section>
              ))}
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  )
}

export default HelpPage
