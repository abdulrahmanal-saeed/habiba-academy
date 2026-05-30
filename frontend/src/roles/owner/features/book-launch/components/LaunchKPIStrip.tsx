import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { BookLaunchData } from '../types'
import { LaunchStatusBadge } from './LaunchStatusBadge'
import { stagger, cardVariant } from '../animations'

interface Props {
  data: BookLaunchData
}

export const LaunchKPIStrip: FC<Props> = ({ data }) => {
  const doneCount = data.readiness.filter((r) => r.done).length
  const total = data.readiness.length

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="row g-3 mb-4">
      {[
        {
          label: 'Visibility',
          value: <LaunchStatusBadge status={data.settings.student_visibility_status} />,
        },
        { label: 'Active Access', value: data.active_access },
        { label: 'Pending Requests', value: data.pending_requests },
        { label: 'Readiness', value: `${doneCount}/${total}` },
      ].map(({ label, value }) => (
        <motion.div key={label} variants={cardVariant} className="col-6 col-md-3">
          <div
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
            }}
          >
            <div className="fw-bold fs-5">{value}</div>
            <div className="small" style={{ color: 'var(--muted)' }}>{label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
