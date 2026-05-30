import { useState } from 'react'
import type { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { HelpArticle } from '../types'

export interface HelpAccordionProps {
  articles: HelpArticle[]
  onReadMore?: (article: HelpArticle) => void
}

const AccordionItem: FC<{ article: HelpArticle; onReadMore?: (a: HelpArticle) => void }> = ({
  article,
  onReadMore,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)]"
      style={{ border: '1px solid var(--border-soft)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors"
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
            {onReadMore && (
              <div
                className="px-5 pb-4"
                style={{ background: 'var(--surface)' }}
              >
                <button
                  type="button"
                  onClick={() => onReadMore(article)}
                  className="text-xs font-medium underline underline-offset-4"
                  style={{ color: 'var(--accent)' }}
                >
                  قراءة المقال كاملاً
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const HelpAccordion: FC<HelpAccordionProps> = ({ articles, onReadMore }) => {
  if (articles.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {articles.map((a) => (
        <AccordionItem key={a.id} article={a} onReadMore={onReadMore} />
      ))}
    </div>
  )
}
