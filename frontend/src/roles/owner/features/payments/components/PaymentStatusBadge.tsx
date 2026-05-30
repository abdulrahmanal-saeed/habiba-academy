import type { FC } from 'react'
import type { PaymentStatus } from '../types'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid:                 { label: 'Paid',                 color: 'var(--success)', bg: 'rgba(var(--success-rgb, 16,185,129), 0.12)' },
  pending:              { label: 'Pending',              color: 'var(--warning)', bg: 'rgba(var(--warning-rgb, 245,158,11), 0.12)' },
  pending_verification: { label: 'Pending Verification', color: 'var(--warning)', bg: 'rgba(var(--warning-rgb, 245,158,11), 0.12)' },
  failed:               { label: 'Failed',               color: 'var(--danger)',  bg: 'rgba(var(--danger-rgb, 239,68,68), 0.12)' },
  refunded:             { label: 'Refunded',             color: 'var(--muted)',   bg: 'var(--border)' },
}

export const PaymentStatusBadge: FC<PaymentStatusBadgeProps> = ({ status }) => {
  const { label, color, bg } = STATUS_CONFIG[status] ?? { label: status, color: 'var(--muted)', bg: 'var(--border)' }
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  )
}
