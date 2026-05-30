import type { FC } from 'react'
import type { ArticleStatus } from '../types'

interface ArticleStatusBadgeProps {
  status: ArticleStatus
}

export const ArticleStatusBadge: FC<ArticleStatusBadgeProps> = ({ status }) => (
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
