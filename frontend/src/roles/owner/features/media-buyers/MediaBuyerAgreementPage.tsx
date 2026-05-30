import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cardVariant } from './animations'
import { AgreementEditor } from './components/AgreementEditor'
import { useAgreementTemplate, useSaveAgreement } from './hooks/useMediaBuyers'

const MediaBuyerAgreementPage: FC = () => {
  const navigate = useNavigate()
  const { data: template, isLoading, isError } = useAgreementTemplate()
  const saveAgreement = useSaveAgreement()

  return (
    <div className="dash-content">
      <motion.div variants={cardVariant} initial="hidden" animate="visible" className="mb-4">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div>
            <div className="fw-bold fs-4">Media Buyer Agreement</div>
            <div className="small" style={{ color: 'var(--muted)' }}>
              Edit the active commission agreement template.
            </div>
          </div>
          <button
            type="button" className="btn btn-ghost btn-sm"
            onClick={() => navigate('/owner/media-buyers')}
          >← Back</button>
        </div>
      </motion.div>

      {saveAgreement.isSuccess && (
        <div className="alert alert-success mb-3">Agreement template saved.</div>
      )}
      {saveAgreement.isError && (
        <div className="alert alert-danger mb-3">{(saveAgreement.error as Error).message}</div>
      )}

      {isLoading && <div style={{ color: 'var(--muted)' }}>Loading…</div>}
      {isError && <div className="alert alert-danger">Failed to load agreement template.</div>}

      {template && (
        <AgreementEditor
          template={template}
          onSave={(fd) => saveAgreement.mutate(fd)}
          loading={saveAgreement.isPending}
        />
      )}
    </div>
  )
}

export default MediaBuyerAgreementPage
