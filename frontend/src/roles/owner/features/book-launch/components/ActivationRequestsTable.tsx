import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { ActivationRequest } from '../types'
import { stagger, rowVariant } from '../animations'

const STATUS_COLORS: Record<string, string> = {
  pending:        'var(--warning)',
  approved:       'var(--accent)',
  rejected:       'var(--danger)',
  needs_more_info: 'var(--muted)',
}

interface Props {
  requests: ActivationRequest[]
  onReview: (request: ActivationRequest) => void
}

export const ActivationRequestsTable: FC<Props> = ({ requests, onReview }) => {
  if (requests.length === 0) {
    return (
      <div className="small text-center py-4" style={{ color: 'var(--muted)' }}>
        No activation requests found.
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-2">
      {requests.map((req) => (
        <motion.div
          key={req.id}
          variants={rowVariant}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1rem',
          }}
        >
          <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
            <div>
              <div className="fw-semibold">{req.full_name}</div>
              <div className="small" style={{ color: 'var(--muted)' }}>{req.login_code}</div>
              <div className="small mt-1">
                <span className="fw-semibold">{req.book_title}</span>
                {' · AED '}
                <span style={{ color: 'var(--accent)' }}>{req.price}</span>
              </div>
              {req.student_notes && (
                <div
                  className="small mt-1 p-2 rounded-2"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)', fontStyle: 'italic' }}
                >
                  "{req.student_notes}"
                </div>
              )}
              {req.admin_note && (
                <div className="small mt-1" style={{ color: 'var(--muted)' }}>
                  Admin note: {req.admin_note}
                </div>
              )}
              <div className="small mt-1" style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                {req.created_at?.slice(0, 16).replace('T', ' ')}
              </div>
            </div>
            <div className="d-flex flex-column align-items-end gap-2">
              <span
                className="badge"
                style={{
                  background: STATUS_COLORS[req.status] ?? 'var(--muted)',
                  color: '#fff',
                  fontSize: '0.7rem',
                }}
              >
                {req.status.replace(/_/g, ' ')}
              </span>
              {(req.status === 'pending' || req.status === 'needs_more_info') && (
                <motion.button
                  type="button"
                  className="btn btn-app btn-sm"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onReview(req)}
                >
                  Review
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
