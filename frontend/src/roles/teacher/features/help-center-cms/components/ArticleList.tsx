import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Pencil, Trash2, Star } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import type { HelpArticle } from '../types'

interface ArticleListProps {
  articles: HelpArticle[]
  onEdit: (article: HelpArticle) => void
  onDelete: (id: number) => void
}

export const ArticleList: FC<ArticleListProps> = ({ articles, onEdit, onDelete }) => {
  function handleDelete(id: number, title: string): void {
    if (window.confirm(`Delete "${title}"?`)) onDelete(id)
  }

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No articles yet. Create one.</p>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
      {articles.map((a) => (
        <motion.div
          key={a.id}
          variants={listItem}
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          whileHover={{ y: -1 }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {a.featured && <Star size={12} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />}
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{a.title}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {a.category_title && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{a.category_title}</span>
              )}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: a.status === 'published' ? 'var(--success-soft, rgba(16,185,129,0.1))' : 'var(--border)',
                  color: a.status === 'published' ? 'var(--success)' : 'var(--muted)',
                }}
              >
                {a.status}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{a.visible_roles}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(a)}
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
              aria-label="Edit article"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(a.id, a.title)}
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ background: 'var(--error-soft, rgba(239,68,68,0.1))', color: 'var(--error)', border: 'none', cursor: 'pointer' }}
              aria-label="Delete article"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
