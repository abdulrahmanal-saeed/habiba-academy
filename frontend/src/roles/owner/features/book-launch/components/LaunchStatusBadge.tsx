import type { FC } from 'react'
import type { VisibilityStatus } from '../types'

const CONFIG: Record<VisibilityStatus, { label: string; bg: string }> = {
  hidden:               { label: 'Hidden',              bg: 'var(--muted)' },
  teacher_preview_only: { label: 'Teacher Preview Only', bg: 'var(--info)' },
  coming_soon:          { label: 'Coming Soon',          bg: 'var(--warning)' },
  launched:             { label: 'Live for Students',    bg: 'var(--accent)' },
  paused:               { label: 'Paused',               bg: 'var(--danger)' },
}

export const LaunchStatusBadge: FC<{ status: VisibilityStatus }> = ({ status }) => {
  const { label, bg } = CONFIG[status] ?? { label: status, bg: 'var(--muted)' }
  return (
    <span className="badge" style={{ background: bg, color: '#fff', fontSize: '0.75rem' }}>
      {label}
    </span>
  )
}
