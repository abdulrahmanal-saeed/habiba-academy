import type { FC } from 'react'
import type { VideoStatus } from '../types'

interface VideoStatusBadgeProps {
  status: VideoStatus
}

export const VideoStatusBadge: FC<VideoStatusBadgeProps> = ({ status }) => (
  <span
    className="px-2 py-0.5 rounded-full text-xs font-semibold"
    style={{
      background: status === 'published' ? 'var(--accent-soft)' : 'var(--surface)',
      color:      status === 'published' ? 'var(--accent)'      : 'var(--muted)',
      border: `1px solid ${status === 'published' ? 'var(--accent)' : 'var(--border)'}`,
    }}
  >
    {status === 'published' ? 'Published' : 'Draft'}
  </span>
)
