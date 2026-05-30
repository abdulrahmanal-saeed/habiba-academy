import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAcademyBriefs } from './hooks/useAcademyBriefs'
import { BriefStatusBadge } from './components/BriefStatusBadge'
import { stagger, cardVariant } from './animations'

const AcademyBriefsPage: FC = () => {
  const { data: briefs = [], isLoading } = useAcademyBriefs()

  return (
    <div className="dash-content">
      <motion.div variants={cardVariant} initial="hidden" animate="visible" className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="fw-bold fs-4">Academy Briefs</div>
            <div className="small" style={{ color: 'var(--muted)' }}>
              Student leads submitted by academy partners.
            </div>
          </div>
          <Link to="/owner/academies" className="btn btn-ghost btn-sm">Academies</Link>
        </div>
      </motion.div>

      {isLoading && <div style={{ color: 'var(--muted)' }}>Loading…</div>}

      {!isLoading && briefs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem 0' }}>
          No briefs submitted yet.
        </div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-3">
        {briefs.map((b) => (
          <motion.div
            key={b.id}
            variants={cardVariant}
            whileHover={{ y: -1 }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', padding: '1rem 1.25rem',
            }}
          >
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <div className="fw-semibold">{b.student_name}</div>
                <div className="small" style={{ color: 'var(--muted)' }}>
                  {b.academy_name ?? b.source_name ?? '—'} · {b.created_at?.slice(0, 10)}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <BriefStatusBadge status={b.brief_status} />
                <Link
                  to={`/owner/academy-briefs/${b.id}`}
                  className="btn btn-ghost btn-sm"
                >
                  Review
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default AcademyBriefsPage
