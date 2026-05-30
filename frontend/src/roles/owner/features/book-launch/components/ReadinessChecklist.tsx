import type { FC } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle } from 'lucide-react'
import type { ReadinessItem } from '../types'
import { stagger, itemVariant } from '../animations'

interface Props {
  items: ReadinessItem[]
}

export const ReadinessChecklist: FC<Props> = ({ items }) => {
  const doneCount = items.filter((i) => i.done).length

  return (
    <div
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="fw-bold fs-5">Readiness Checklist</div>
        <span
          className="badge"
          style={{
            background: doneCount === items.length ? 'var(--accent)' : 'var(--warning)',
            color: '#fff',
          }}
        >
          {doneCount}/{items.length}
        </span>
      </div>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-2">
        {items.map((item) => (
          <motion.div
            key={item.label}
            variants={itemVariant}
            className="d-flex align-items-center gap-2"
          >
            {item.done ? (
              <CheckCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            )}
            <span className="small">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
      {doneCount < items.length && (
        <div
          className="small mt-3 p-2 rounded-3"
          style={{ background: 'var(--warning-soft, rgba(255,193,7,0.1))', color: 'var(--warning)' }}
        >
          Some items are not complete. You can still launch, but test carefully first.
        </div>
      )}
    </div>
  )
}
