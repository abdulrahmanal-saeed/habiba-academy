import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import { VideoStatusBadge } from './VideoStatusBadge'
import type { Video } from '../types'

interface VideosTableProps {
  videos: Video[]
  onEdit: (video: Video) => void
  onDelete: (id: number) => void
  onToggle: (id: number) => void
  isToggling: boolean
  isDeleting: boolean
}

export const VideosTable: FC<VideosTableProps> = ({
  videos, onEdit, onDelete, onToggle, isToggling, isDeleting,
}) => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
    {videos.map((v) => (
      <motion.div
        key={v.id}
        variants={cardVariant}
        className="flex items-center gap-3 rounded-2xl p-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* YouTube thumbnail */}
        <img
          src={v.thumbnail_url}
          alt={v.title}
          className="rounded-xl object-cover flex-shrink-0"
          style={{ width: 72, height: 52, border: '1px solid var(--border)' }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{v.title}</p>
          <p className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--muted)' }}>{v.slug}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <VideoStatusBadge status={v.status} />
            {v.show_on_homepage && (
              <span className="text-xs px-1.5 py-0.5 rounded-lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                Homepage
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Sort: {v.sort_order}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            title={v.status === 'published' ? 'Set draft' : 'Publish'}
            onClick={() => onToggle(v.id)}
            disabled={isToggling}
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            {v.status === 'published'
              ? <ToggleRight size={14} style={{ color: 'var(--accent)' }} />
              : <ToggleLeft size={14} />
            }
          </button>
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(v)}
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => onDelete(v.id)}
            disabled={isDeleting}
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </motion.div>
    ))}
    {videos.length === 0 && (
      <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No videos yet.</p>
    )}
  </motion.div>
)
