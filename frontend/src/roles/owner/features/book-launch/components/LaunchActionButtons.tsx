import { useState, type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { drawerVariant } from '../animations'

interface Props {
  onAction: (action: 'launch' | 'hide' | 'pause') => void
  loading?: boolean
}

export const LaunchActionButtons: FC<Props> = ({ onAction, loading }) => {
  const [confirmLaunch, setConfirmLaunch] = useState(false)

  return (
    <>
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1rem',
        }}
      >
        <div className="d-flex gap-2 flex-wrap">
          <motion.button
            type="button" className="btn btn-app" disabled={loading}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
            onClick={() => setConfirmLaunch(true)}
          >
            🚀 Launch Book to Students
          </motion.button>
          <motion.button
            type="button" className="btn btn-ghost" disabled={loading}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
            onClick={() => { if (window.confirm('Hide this book from students?')) onAction('hide') }}
          >
            Hide from Students
          </motion.button>
          <motion.button
            type="button" className="btn btn-ghost" disabled={loading}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
            onClick={() => { if (window.confirm('Pause new sales and activation requests?')) onAction('pause') }}
          >
            Pause New Sales
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {confirmLaunch && (
          <motion.div
            variants={drawerVariant} initial="hidden" animate="visible" exit="exit"
            style={{
              position: 'fixed', inset: 0, zIndex: 400, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
            }}
            onClick={() => setConfirmLaunch(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--surface)', borderRadius: '1rem', padding: '2rem',
                maxWidth: 480, width: '90%', boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="fw-bold fs-5 mb-2">Launch this book to students?</div>
              <p className="small mb-2">
                This will make the book marketing and sales flow visible to logged-in students.
              </p>
              <p className="small mb-4" dir="rtl" style={{ color: 'var(--muted)' }}>
                سيؤدي ذلك إلى ظهور تسويق الكتاب للطلاب المسجلين حسب الإعدادات المفعلة.
              </p>
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmLaunch(false)}>
                  Cancel
                </button>
                <motion.button
                  type="button" className="btn btn-app"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setConfirmLaunch(false); onAction('launch') }}
                >
                  Yes, Launch Book
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
