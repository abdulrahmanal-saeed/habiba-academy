import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { CourseMaterial } from '../types'

const TYPE_ICONS: Record<string, string> = {
  video: '▶', video_link: '▶', audio: '🔊', pdf: '📄', pptx: '📊',
  document: '📝', image: '🖼', link: '🔗', article: '📰', html: '🌐', mixed: '📦',
}

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-[var(--surface-2)] text-[var(--text-2)]',
  hidden: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
}

interface Props {
  material: CourseMaterial
  onEdit: (m: CourseMaterial) => void
  onDelete: (id: number) => void
}

export const MaterialRow: FC<Props> = ({ material, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3"
  >
    <span className="mt-0.5 text-lg">{TYPE_ICONS[material.type] ?? '📦'}</span>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-[var(--text-1)] truncate">{material.title}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[material.status] ?? ''}`}>
          {material.status}
        </span>
        {material.category && (
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-2)]">
            {material.category.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      {material.description && (
        <p className="mt-0.5 text-xs text-[var(--text-3)] line-clamp-1">{material.description}</p>
      )}
      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-3)]">
        <span>{material.type.replace(/_/g, ' ')}</span>
        {material.language !== 'both' && <span>· {material.language}</span>}
        {material.estimated_study_minutes > 0 && (
          <span>· {material.estimated_study_minutes} min</span>
        )}
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-1">
      {material.href && (
        <a
          href={material.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--surface-2)]"
        >
          Open
        </a>
      )}
      <button
        onClick={() => onEdit(material)}
        className="rounded-lg px-2 py-1 text-xs text-[var(--text-2)] hover:bg-[var(--surface-2)]"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(material.id)}
        className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  </motion.div>
)
