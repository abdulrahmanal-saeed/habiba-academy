import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { AILogsHealth } from '../types'
import { stagger, cardVariant } from '../animations'

interface Props {
  health: AILogsHealth
}

export const AIHealthStrip: FC<Props> = ({ health }) => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="row g-3 mb-4">
    {[
      { label: 'Total Requests', value: health.total, color: 'var(--text)' },
      { label: 'Success',        value: health.success, color: 'var(--accent)' },
      { label: 'Failed',         value: health.failed, color: 'var(--danger)' },
      { label: 'Cached Hits',    value: health.cached, color: 'var(--warning)' },
    ].map(({ label, value, color }) => (
      <motion.div key={label} variants={cardVariant} className="col-6 col-md-3">
        <div
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
          }}
        >
          <div className="fw-bold fs-5" style={{ color }}>{value}</div>
          <div className="small" style={{ color: 'var(--muted)' }}>{label}</div>
        </div>
      </motion.div>
    ))}
  </motion.div>
)
