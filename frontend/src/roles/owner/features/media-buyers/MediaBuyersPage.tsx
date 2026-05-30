import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cardVariant } from './animations'
import { MediaBuyerForm } from './components/MediaBuyerForm'
import { MediaBuyersTable } from './components/MediaBuyersTable'
import { useMediaBuyers, useSaveMediaBuyer, useDeleteMediaBuyer } from './hooks/useMediaBuyers'

const MediaBuyersPage: FC = () => {
  const { data: buyers = [], isLoading } = useMediaBuyers()
  const saveBuyer = useSaveMediaBuyer()
  const deleteBuyer = useDeleteMediaBuyer()

  return (
    <div className="dash-content">
      <motion.div variants={cardVariant} initial="hidden" animate="visible" className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="fw-bold fs-4">Media Buyers</div>
            <div className="small" style={{ color: 'var(--muted)' }}>
              Manage ad partners, commission rates, and tracking.
            </div>
          </div>
          <Link to="/owner/media-buyers/agreement" className="btn btn-app btn-sm">
            Agreement Template
          </Link>
        </div>
      </motion.div>

      {saveBuyer.isError && (
        <div className="alert alert-danger mb-3">{(saveBuyer.error as Error).message}</div>
      )}

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <MediaBuyerForm
            onSubmit={(fd) => saveBuyer.mutate(fd)}
            loading={saveBuyer.isPending}
          />
        </div>
        <div className="col-12 col-xl-7">
          <motion.div
            variants={cardVariant} initial="hidden" animate="visible"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
          >
            <div className="fw-bold fs-5 mb-3">
              Media Buyer Records
              {buyers.length > 0 && (
                <span className="ms-2 badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {buyers.length}
                </span>
              )}
            </div>
            {isLoading ? (
              <div style={{ color: 'var(--muted)' }}>Loading…</div>
            ) : (
              <MediaBuyersTable
                buyers={buyers}
                onDelete={(id) => deleteBuyer.mutate(id)}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default MediaBuyersPage
