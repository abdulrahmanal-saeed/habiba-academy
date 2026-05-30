import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { MediaBuyer } from '../types'
import { stagger, rowVariant } from '../animations'

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--accent)',
  paused: 'var(--warning)',
  inactive: 'var(--muted)',
}

interface Props {
  buyers: MediaBuyer[]
  onDelete: (id: number) => void
}

export const MediaBuyersTable: FC<Props> = ({ buyers, onDelete }) => {
  if (buyers.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem 0' }}>
        No media buyers added yet.
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-3">
      {buyers.map((b) => (
        <motion.div
          key={b.id}
          variants={rowVariant}
          whileHover={{ y: -1 }}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1rem 1.25rem',
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div className="flex-1">
              <div className="fw-semibold">{b.full_name}</div>
              {(b.email ?? b.whatsapp) && (
                <div className="small" style={{ color: 'var(--muted)' }}>{b.email ?? b.whatsapp}</div>
              )}
              {b.access_code && (
                <div className="small" style={{ color: 'var(--muted)' }}>Access: <code>{b.access_code}</code></div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <span
                className="badge"
                style={{ background: STATUS_COLORS[b.status] ?? 'var(--muted)', color: '#fff' }}
              >
                {b.status}
              </span>
              <button
                type="button" className="btn btn-sm"
                style={{ color: 'var(--danger)', background: 'none', border: '1px solid var(--danger)' }}
                onClick={() => { if (window.confirm(`Deactivate "${b.full_name}"?`)) onDelete(b.id) }}
              >×</button>
            </div>
          </div>
          <div className="d-flex gap-4 mt-2 flex-wrap">
            <div className="small">
              <span style={{ color: 'var(--muted)' }}>Visits:</span>{' '}
              <strong>{b.visits_count}</strong>
            </div>
            <div className="small">
              <span style={{ color: 'var(--muted)' }}>30-day attrs:</span>{' '}
              <strong>{b.attributed_visitors}</strong>
            </div>
            <div className="small">
              <span style={{ color: 'var(--muted)' }}>Paid orders:</span>{' '}
              <strong>{b.paid_orders_count}</strong>
            </div>
            <div className="small">
              <span style={{ color: 'var(--muted)' }}>Revenue:</span>{' '}
              <strong>AED {b.paid_amount.toFixed(2)}</strong>
            </div>
            {b.commission_rate !== null && (
              <div className="small">
                <span style={{ color: 'var(--muted)' }}>Commission:</span>{' '}
                <strong>{b.commission_rate.toFixed(2)}%</strong>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
