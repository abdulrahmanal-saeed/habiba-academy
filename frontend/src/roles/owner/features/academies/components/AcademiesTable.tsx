import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { Academy } from '../types'
import { stagger, rowVariant } from '../animations'

interface Props {
  academies: Academy[]
  onEdit: (academy: Academy) => void
  onDelete: (id: number) => void
}

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--accent)',
  paused: 'var(--warning)',
  inactive: 'var(--muted)',
}

export const AcademiesTable: FC<Props> = ({ academies, onEdit, onDelete }) => {
  if (academies.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem 0' }}>
        No academies added yet.
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-3">
      {academies.map((a) => (
        <motion.div
          key={a.id}
          variants={rowVariant}
          whileHover={{ y: -1 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div className="flex-1">
              <div className="fw-semibold">{a.name}</div>
              {a.contact_name && (
                <div className="small" style={{ color: 'var(--muted)' }}>{a.contact_name}</div>
              )}
              {(a.email ?? a.whatsapp) && (
                <div className="small" style={{ color: 'var(--muted)' }}>{a.email ?? a.whatsapp}</div>
              )}
              <div className="small mt-1" style={{ color: 'var(--muted)' }}>
                {a.student_count} student{a.student_count !== 1 ? 's' : ''}
                {a.access_code && <> · Access: <code>{a.access_code}</code></>}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span
                className="badge"
                style={{ background: STATUS_COLORS[a.status] ?? 'var(--muted)', color: '#fff' }}
              >
                {a.status}
              </span>
              <button
                type="button" className="btn btn-ghost btn-sm"
                onClick={() => onEdit(a)}
              >Edit</button>
              <button
                type="button" className="btn btn-sm"
                style={{ color: 'var(--danger)', background: 'none', border: '1px solid var(--danger)' }}
                onClick={() => {
                  if (window.confirm(`Deactivate "${a.name}"?`)) onDelete(a.id)
                }}
              >×</button>
            </div>
          </div>
          {a.students && (
            <div className="small mt-2" style={{ color: 'var(--muted)' }}>
              {a.students}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
