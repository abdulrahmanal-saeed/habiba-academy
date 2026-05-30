import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Pencil, BookOpen } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import type { HelpCategory } from '../types'

interface CategoryListProps {
  categories: HelpCategory[]
  onEdit: (category: HelpCategory) => void
}

export const CategoryList: FC<CategoryListProps> = ({ categories, onEdit }) => {
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>No categories yet.</p>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
      {categories.map((c) => (
        <motion.div
          key={c.id}
          variants={listItem}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{
            background: c.active ? 'var(--surface)' : 'transparent',
            border: `1px solid ${c.active ? 'var(--border)' : 'var(--border)'}`,
            opacity: c.active ? 1 : 0.5,
          }}
        >
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <BookOpen size={13} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--fg)' }}>{c.title}</p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {c.article_count ?? 0} articles · {c.roles}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="flex items-center justify-center w-6 h-6 rounded-lg"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
            aria-label="Edit category"
          >
            <Pencil size={11} />
          </button>
        </motion.div>
      ))}
    </motion.div>
  )
}
