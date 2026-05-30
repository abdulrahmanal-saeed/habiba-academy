import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { Parent } from '../types'
import { stagger, rowVariant } from '../animations'

interface Props {
  parents: Parent[]
  onDelete: (id: number) => void
  loading: boolean
}

export const ParentsTable: FC<Props> = ({ parents, onDelete, loading }) => {
  if (parents.length === 0) {
    return (
      <div className="small text-center py-4" style={{ color: 'var(--muted)' }}>
        No parents added yet.
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-2">
      {parents.map((p) => (
        <motion.div
          key={p.id}
          variants={rowVariant}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1rem',
          }}
        >
          <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
            <div>
              <div className="fw-semibold">{p.full_name}</div>
              <div className="small" style={{ color: 'var(--muted)' }}>
                {p.email ?? p.whatsapp ?? '—'}
              </div>
              {p.access_code && (
                <div className="small mt-1">
                  <span
                    className="badge"
                    style={{ background: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                  >
                    {p.access_code}
                  </span>
                </div>
              )}
              <div className="small mt-1" style={{ color: 'var(--muted)' }}>
                <span className="fw-semibold">{p.student_count}</span> student{p.student_count !== 1 ? 's' : ''}
                {p.students ? ` · ${p.students}` : ''}
              </div>
            </div>
            <div className="d-flex flex-column align-items-end gap-2">
              <span
                className="badge"
                style={{
                  background: p.status === 'active' ? 'var(--accent)' : 'var(--muted)',
                  color: '#fff',
                  fontSize: '0.7rem',
                }}
              >
                {p.status}
              </span>
              {p.status === 'active' && (
                <motion.button
                  type="button" className="btn btn-sm"
                  disabled={loading}
                  style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'none' }}
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { if (window.confirm(`Deactivate ${p.full_name}?`)) onDelete(p.id) }}
                >
                  Deactivate
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
