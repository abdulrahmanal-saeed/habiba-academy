import type { FC } from 'react'
import type { BriefStatus } from '../types'

const COLORS: Record<BriefStatus, string> = {
  submitted: 'var(--info)',
  under_review: 'var(--warning)',
  needs_more_info: 'var(--warning)',
  accepted: 'var(--accent)',
  converted_to_student: 'var(--accent)',
  rejected: 'var(--danger)',
  archived: 'var(--muted)',
}

const LABELS: Record<BriefStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  needs_more_info: 'Needs Info',
  accepted: 'Accepted',
  converted_to_student: 'Converted',
  rejected: 'Rejected',
  archived: 'Archived',
}

export const BriefStatusBadge: FC<{ status: BriefStatus }> = ({ status }) => (
  <span
    className="badge"
    style={{ background: COLORS[status] ?? 'var(--muted)', color: '#fff', fontSize: '0.7rem' }}
  >
    {LABELS[status] ?? status}
  </span>
)
