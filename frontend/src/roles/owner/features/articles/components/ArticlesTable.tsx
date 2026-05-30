import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Pencil, Trash2, ToggleLeft, ToggleRight, ImageOff } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import { ArticleStatusBadge } from './ArticleStatusBadge'
import type { Article } from '../types'

interface ArticlesTableProps {
  articles: Article[]
  onEdit: (article: Article) => void
  onDelete: (id: number) => void
  onToggle: (id: number) => void
  isToggling: boolean
  isDeleting: boolean
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export const ArticlesTable: FC<ArticlesTableProps> = ({
  articles, onEdit, onDelete, onToggle, isToggling, isDeleting,
}) => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
    {articles.map((a) => (
      <motion.div
        key={a.id}
        variants={cardVariant}
        className="flex items-center gap-3 rounded-2xl p-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Cover thumbnail */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ width: 52, height: 52, background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          {a.cover_image
            ? <img src={`${baseUrl}/${a.cover_image}`} alt={a.title} className="w-full h-full object-cover" />
            : <ImageOff size={18} style={{ color: 'var(--muted)' }} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{a.title}</p>
          <p className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--muted)' }}>{a.slug}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ArticleStatusBadge status={a.status} />
            {a.show_on_homepage && (
              <span className="text-xs px-1.5 py-0.5 rounded-lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                Homepage
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Sort: {a.sort_order}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            title={a.status === 'published' ? 'Set draft' : 'Publish'}
            onClick={() => onToggle(a.id)}
            disabled={isToggling}
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            {a.status === 'published'
              ? <ToggleRight size={14} style={{ color: 'var(--accent)' }} />
              : <ToggleLeft size={14} />
            }
          </button>
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(a)}
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => onDelete(a.id)}
            disabled={isDeleting}
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </motion.div>
    ))}
    {articles.length === 0 && (
      <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No articles yet.</p>
    )}
  </motion.div>
)
