import { useState, type FC } from 'react'
import { motion } from 'framer-motion'
import type { AcademyBrief, BriefStatus } from '../types'
import { cardVariant } from '../animations'

const STATUSES: BriefStatus[] = [
  'submitted','under_review','needs_more_info','accepted',
  'converted_to_student','rejected','archived',
]

interface Props {
  brief: AcademyBrief
  onSave: (status: BriefStatus, notes: string) => void
  loading?: boolean
}

export const BriefStatusForm: FC<Props> = ({ brief, onSave, loading }) => {
  const [status, setStatus] = useState<BriefStatus>(brief.brief_status)
  const [notes, setNotes] = useState(brief.owner_notes ?? '')

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
    >
      <div className="fw-bold fs-5 mb-3">Review Brief</div>
      <div className="d-grid gap-3">
        <div>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as BriefStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Owner notes</label>
          <textarea
            className="form-control"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes about this brief…"
          />
        </div>
        <motion.button
          type="button"
          className="btn btn-app"
          disabled={loading}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSave(status, notes)}
        >
          {loading ? 'Saving…' : 'Save Review'}
        </motion.button>
        {status === 'converted_to_student' && (
          <div
            className="small p-3 rounded-3"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            Setting status to "Converted" will record this student as enrolled and notify the academy.
          </div>
        )}
      </div>
    </motion.div>
  )
}
