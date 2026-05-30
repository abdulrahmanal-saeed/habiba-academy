import { useState, type FC, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import type { Academy, StudentOption } from '../types'
import { cardVariant } from '../animations'

export interface AcademyFormProps {
  students: StudentOption[]
  editing?: Academy | null
  onSubmit: (form: FormData) => void
  onCancel?: () => void
  loading?: boolean
}

export const AcademyForm: FC<AcademyFormProps> = ({ students, editing, onSubmit, onCancel, loading }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(editing ? [] : []),
  )

  function toggleStudent(id: number): void {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const raw = new FormData(e.currentTarget)
    const fd = new FormData()
    fd.append('action', 'save')
    if (editing) fd.append('id', String(editing.id))
    fd.append('name', (raw.get('name') as string) ?? '')
    fd.append('contact_name', (raw.get('contact_name') as string) ?? '')
    fd.append('email', (raw.get('email') as string) ?? '')
    fd.append('whatsapp', (raw.get('whatsapp') as string) ?? '')
    fd.append('status', (raw.get('status') as string) ?? 'active')
    fd.append('notes', (raw.get('notes') as string) ?? '')
    selectedIds.forEach((id) => fd.append('student_ids[]', String(id)))
    onSubmit(fd)
  }

  return (
    <motion.div variants={cardVariant} initial="hidden" animate="visible"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
    >
      <div className="fw-bold fs-5 mb-3">{editing ? 'Edit Academy' : 'Add Academy'}</div>
      <form onSubmit={handleSubmit} className="d-grid gap-3">
        <div>
          <label className="form-label">Academy name *</label>
          <input name="name" className="form-control" defaultValue={editing?.name ?? ''} required />
        </div>
        <div>
          <label className="form-label">Contact name</label>
          <input name="contact_name" className="form-control" defaultValue={editing?.contact_name ?? ''} />
        </div>
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" defaultValue={editing?.email ?? ''} />
          </div>
          <div className="col-md-6">
            <label className="form-label">WhatsApp</label>
            <input name="whatsapp" className="form-control" defaultValue={editing?.whatsapp ?? ''} />
          </div>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select name="status" className="form-select" defaultValue={editing?.status ?? 'active'}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="form-label">Link students</label>
          <div className="border rounded-3 p-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {students.length === 0 && <div className="text-muted small p-1">No students yet</div>}
            {students.map((s) => (
              <label key={s.id} className="d-flex gap-2 align-items-center py-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedIds.has(s.id)}
                  onChange={() => toggleStudent(s.id)}
                />
                <span className="small">
                  {s.full_name} <span style={{ color: 'var(--muted)' }}>({s.login_code})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea name="notes" className="form-control" rows={3} defaultValue={editing?.notes ?? ''} />
        </div>
        <div className="d-flex gap-2">
          <motion.button
            type="submit" disabled={loading}
            className="btn btn-app flex-1"
            whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Saving…' : editing ? 'Save Changes' : 'Add Academy'}
          </motion.button>
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
