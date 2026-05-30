import { useState, type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ActivationRequest } from '../types'
import { drawerVariant } from '../animations'

interface Props {
  request: ActivationRequest | null
  onClose: () => void
  onApprove: (id: number, note: string) => void
  onReject: (id: number, note: string) => void
  onNeedsInfo: (id: number, note: string) => void
  loading?: boolean
}

export const RequestActionDrawer: FC<Props> = ({
  request, onClose, onApprove, onReject, onNeedsInfo, loading,
}) => {
  const [note, setNote] = useState('')

  function reset(): void {
    setNote('')
    onClose()
  }

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={reset}
        >
          <motion.div
            variants={drawerVariant} initial="hidden" animate="visible" exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: '1rem 1rem 0 0',
              padding: '1.5rem', width: '100%', maxWidth: 600,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="fw-bold fs-5 mb-1">Review Request</div>
            <div className="small mb-3" style={{ color: 'var(--muted)' }}>
              {request.full_name} · {request.book_title} · AED {request.price}
            </div>
            <div>
              <label className="form-label">Admin note (optional)</label>
              <textarea
                className="form-control mb-3" rows={3}
                placeholder="Notes visible to the student…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <motion.button
                type="button" className="btn btn-app" disabled={loading}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onApprove(request.id, note); reset() }}
              >
                Approve
              </motion.button>
              <motion.button
                type="button" className="btn btn-ghost" disabled={loading}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onNeedsInfo(request.id, note); reset() }}
              >
                Need More Info
              </motion.button>
              <motion.button
                type="button" disabled={loading}
                className="btn btn-sm"
                style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'none' }}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onReject(request.id, note); reset() }}
              >
                Reject
              </motion.button>
              <button type="button" className="btn btn-ghost ms-auto" onClick={reset}>
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
