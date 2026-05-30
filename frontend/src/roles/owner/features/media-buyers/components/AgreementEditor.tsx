import { useState, type FC, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import type { AgreementTemplate } from '../types'
import { cardVariant } from '../animations'

interface Props {
  template: AgreementTemplate
  onSave: (form: FormData) => void
  loading?: boolean
}

export const AgreementEditor: FC<Props> = ({ template, onSave, loading }) => {
  const [title, setTitle] = useState(template.title)
  const [version, setVersion] = useState(template.version)
  const [content, setContent] = useState(template.content)
  const [requiresReacceptance, setRequiresReacceptance] = useState(
    template.requires_reacceptance === 1,
  )

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const fd = new FormData()
    fd.append('action', 'save_agreement')
    fd.append('title', title)
    fd.append('version', version)
    fd.append('content', content)
    if (requiresReacceptance) fd.append('requires_reacceptance', '1')
    onSave(fd)
  }

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
    >
      <div className="fw-bold fs-5 mb-3">Media Buyer Agreement Template</div>
      <div className="small mb-3" style={{ color: 'var(--muted)' }}>
        Each save creates a new version. Previous versions are archived.
      </div>
      <form onSubmit={handleSubmit} className="d-grid gap-3">
        <div className="row g-2">
          <div className="col-md-8">
            <label className="form-label">Title</label>
            <input
              className="form-control" required
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Version</label>
            <input
              className="form-control" required
              value={version} onChange={(e) => setVersion(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="form-label">Agreement content</label>
          <textarea
            className="form-control" rows={14} required
            value={content} onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <label className="d-flex align-items-center gap-2">
          <input
            type="checkbox" className="form-check-input"
            checked={requiresReacceptance}
            onChange={(e) => setRequiresReacceptance(e.target.checked)}
          />
          <span className="small">Require re-acceptance for existing media buyers</span>
        </label>
        <motion.button
          type="submit" disabled={loading}
          className="btn btn-app"
          whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Saving…' : 'Save Agreement'}
        </motion.button>
      </form>
    </motion.div>
  )
}
