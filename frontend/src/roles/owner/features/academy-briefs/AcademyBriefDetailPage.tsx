import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAcademyBriefDetail, useUpdateBriefStatus } from './hooks/useAcademyBriefs'
import { BriefDetailCard } from './components/BriefDetailCard'
import { BriefStatusForm } from './components/BriefStatusForm'
import { BriefStatusBadge } from './components/BriefStatusBadge'
import { cardVariant } from './animations'
import type { BriefStatus } from './types'

const AcademyBriefDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const briefId = Number(id ?? 0)
  const navigate = useNavigate()

  const { data: brief, isLoading, isError } = useAcademyBriefDetail(briefId)
  const updateStatus = useUpdateBriefStatus()

  if (isLoading) {
    return <div className="dash-content" style={{ color: 'var(--muted)' }}>Loading…</div>
  }
  if (isError || !brief) {
    return (
      <div className="dash-content">
        <div className="alert alert-danger">Brief not found.</div>
      </div>
    )
  }

  function handleSave(status: BriefStatus, notes: string): void {
    updateStatus.mutate(
      { id: briefId, status, notes },
      { onSuccess: () => navigate('/owner/academy-briefs') },
    )
  }

  return (
    <div className="dash-content">
      <motion.div variants={cardVariant} initial="hidden" animate="visible" className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button" className="btn btn-ghost btn-sm"
              onClick={() => navigate('/owner/academy-briefs')}
            >← Back</button>
            <BriefStatusBadge status={brief.brief_status} />
          </div>
        </div>
      </motion.div>

      {updateStatus.isError && (
        <div className="alert alert-danger mb-3">
          {(updateStatus.error as Error).message}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <BriefDetailCard brief={brief} />
        </div>
        <div className="col-lg-5">
          <BriefStatusForm
            brief={brief}
            onSave={handleSave}
            loading={updateStatus.isPending}
          />
        </div>
      </div>
    </div>
  )
}

export default AcademyBriefDetailPage
