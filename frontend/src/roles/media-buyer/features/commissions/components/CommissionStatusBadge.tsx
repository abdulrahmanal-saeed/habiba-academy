import type { FC } from 'react'
import type { CommissionStatus } from '../types'

const MAP: Record<CommissionStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'var(--warning-bg)',  color: 'var(--warning)',  label: 'قيد الانتظار' },
  paid:      { bg: 'var(--success-bg)',  color: 'var(--success)',  label: 'مدفوعة' },
  cancelled: { bg: 'var(--danger-bg)',   color: 'var(--danger)',   label: 'ملغاة' },
}

interface Props { status: CommissionStatus }

export const CommissionStatusBadge: FC<Props> = ({ status }) => {
  const { bg, color, label } = MAP[status] ?? MAP.pending
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}
