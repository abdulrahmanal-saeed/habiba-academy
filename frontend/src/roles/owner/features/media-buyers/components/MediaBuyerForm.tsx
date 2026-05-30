import type { FC, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { cardVariant } from '../animations'

interface Props {
  onSubmit: (form: FormData) => void
  loading?: boolean
}

export const MediaBuyerForm: FC<Props> = ({ onSubmit, loading }) => {
  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const raw = new FormData(e.currentTarget)
    const fd = new FormData()
    fd.append('action', 'save')
    fd.append('full_name', (raw.get('full_name') as string) ?? '')
    fd.append('email', (raw.get('email') as string) ?? '')
    fd.append('whatsapp', (raw.get('whatsapp') as string) ?? '')
    fd.append('commission_rate', (raw.get('commission_rate') as string) ?? '')
    fd.append('status', (raw.get('status') as string) ?? 'active')
    fd.append('notes', (raw.get('notes') as string) ?? '')
    onSubmit(fd)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
    >
      <div className="fw-bold fs-5 mb-3">Add Media Buyer</div>
      <form onSubmit={handleSubmit} className="d-grid gap-3">
        <div>
          <label className="form-label">Name *</label>
          <input name="full_name" className="form-control" required />
        </div>
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label">WhatsApp</label>
            <input name="whatsapp" className="form-control" />
          </div>
        </div>
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Commission rate (%)</label>
            <input name="commission_rate" type="number" step="0.01" min="0" max="100" className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <select name="status" className="form-select" defaultValue="active">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea name="notes" className="form-control" rows={3} />
        </div>
        <motion.button
          type="submit" disabled={loading}
          className="btn btn-app"
          whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Saving…' : 'Add Media Buyer'}
        </motion.button>
      </form>
    </motion.div>
  )
}
