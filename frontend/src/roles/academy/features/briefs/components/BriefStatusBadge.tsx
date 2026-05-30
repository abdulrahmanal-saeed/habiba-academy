import type { FC } from 'react'
import type { BriefStatus } from '../types'

interface Props { status: BriefStatus }

const MAP: Record<BriefStatus, { bg: string; color: string; label: string }> = {
  submitted: { bg: 'var(--accent-soft)', color: 'var(--accent)', label: 'مُقدَّم' },
  reviewing: { bg: 'var(--info-bg)',     color: 'var(--info)',    label: 'قيد المراجعة' },
  accepted:  { bg: 'var(--success-bg)', color: 'var(--success)', label: 'مقبول' },
  rejected:  { bg: 'var(--danger-bg)',  color: 'var(--danger)',  label: 'مرفوض' },
}

export const BriefStatusBadge: FC<Props> = ({ status }) => {
  const cfg = MAP[status] ?? MAP.submitted
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}
