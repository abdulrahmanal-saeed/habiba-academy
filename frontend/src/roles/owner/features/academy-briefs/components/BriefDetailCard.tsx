import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { AcademyBrief } from '../types'
import { cardVariant } from '../animations'

const FIELDS: Array<{ key: keyof AcademyBrief; label: string }> = [
  { key: 'age', label: 'Age' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'native_language', label: 'Current level / language' },
  { key: 'main_goal', label: 'Goal' },
  { key: 'learning_reason', label: 'Learning reason' },
  { key: 'speaking_ability', label: 'Speaking ability' },
  { key: 'reading_writing_ability', label: 'Reading / writing' },
  { key: 'parent_contact_info', label: 'Parent contact' },
  { key: 'preferred_schedule', label: 'Preferred schedule' },
  { key: 'additional_notes', label: 'Academy notes' },
]

export const BriefDetailCard: FC<{ brief: AcademyBrief }> = ({ brief }) => (
  <motion.div
    variants={cardVariant} initial="hidden" animate="visible"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
  >
    <div className="fw-bold fs-4 mb-1">{brief.student_name}</div>
    <div className="small mb-4" style={{ color: 'var(--muted)' }}>
      {brief.academy_name ?? brief.source_name ?? 'Academy'} · {brief.created_at?.slice(0, 10)}
    </div>
    <div className="row g-3">
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="col-md-6">
          <div className="small fw-semibold mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
          <div className="small">
            {(brief[key] as string | null) ?? <span style={{ color: 'var(--muted)' }}>—</span>}
          </div>
        </div>
      ))}
    </div>
  </motion.div>
)
