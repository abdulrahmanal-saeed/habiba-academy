import type { FC } from 'react'
import type { ProgressStatus } from '../types'

export interface ProgressBadgeProps {
  status: ProgressStatus
}

const CONFIG: Record<ProgressStatus, { label: string; bg: string; color: string }> = {
  completed: { label: 'Completed', bg: 'var(--success-soft)', color: 'var(--success)' },
  viewed:    { label: 'Viewed',    bg: 'var(--warning-soft)', color: 'var(--warning)' },
  assigned:  { label: 'New',       bg: 'var(--bg-alt)',       color: 'var(--muted)'   },
}

export const ProgressBadge: FC<ProgressBadgeProps> = ({ status }) => {
  const { label, bg, color } = CONFIG[status]
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}
