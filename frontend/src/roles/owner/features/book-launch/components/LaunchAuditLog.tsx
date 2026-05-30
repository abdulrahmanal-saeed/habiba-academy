import type { FC } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { AuditLogEntry } from '../types'
import { stagger, itemVariant } from '../animations'

interface Props {
  entries: AuditLogEntry[]
}

export const LaunchAuditLog: FC<Props> = ({ entries }) => (
  <div
    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
  >
    <div className="fw-bold fs-5 mb-3">Recent Launch Audit</div>
    {entries.length === 0 ? (
      <div className="small" style={{ color: 'var(--muted)' }}>No launch changes yet.</div>
    ) : (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-2">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            variants={itemVariant}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
            }}
          >
            <div className="d-flex align-items-center gap-1 fw-semibold small">
              <span>{entry.old_status || '—'}</span>
              <ArrowRight size={12} style={{ color: 'var(--muted)' }} />
              <span style={{ color: 'var(--accent)' }}>{entry.new_status}</span>
            </div>
            {entry.change_note && (
              <div className="small mt-1" style={{ color: 'var(--muted)' }}>{entry.change_note}</div>
            )}
            <div className="small mt-1" style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
              {entry.created_at?.slice(0, 16).replace('T', ' ')}
            </div>
          </motion.div>
        ))}
      </motion.div>
    )}
  </div>
)
