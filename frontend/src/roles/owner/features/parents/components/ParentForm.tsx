import { useState, type FC } from 'react'
import { motion } from 'framer-motion'
import type { StudentOption, ParentSavePayload } from '../types'
import { cardVariant } from '../animations'

interface Props {
  students: StudentOption[]
  onSave: (payload: ParentSavePayload) => void
  loading: boolean
}

const BLANK: Omit<ParentSavePayload, 'action'> = {
  full_name: '',
  email: '',
  whatsapp: '',
  status: 'active',
  notes: '',
  student_ids: [],
}

export const ParentForm: FC<Props> = ({ students, onSave, loading }) => {
  const [form, setForm] = useState(BLANK)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  function set(key: keyof typeof BLANK, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggle(id: number): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleSave(): void {
    if (!form.full_name.trim()) return
    onSave({ action: 'save', ...form, student_ids: [...selected] })
    setForm(BLANK)
    setSelected(new Set())
  }

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.5rem',
      }}
    >
      <div className="fw-bold fs-5 mb-3">Add Parent</div>
      <div className="d-grid gap-3">
        <div>
          <label className="form-label">Parent name *</label>
          <input
            className="form-control"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label">WhatsApp</label>
            <input className="form-control" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="form-label">Students</label>
          <div className="border rounded-3 p-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {students.length === 0 && (
              <div className="small py-1" style={{ color: 'var(--muted)' }}>No students yet.</div>
            )}
            {students.map((s) => (
              <label key={s.id} className="d-flex gap-2 align-items-center py-1" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span className="small">
                  {s.full_name}
                  <span className="ms-1" style={{ color: 'var(--muted)' }}>{s.login_code}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
        <motion.button
          type="button" className="btn btn-app"
          disabled={loading || !form.full_name.trim()}
          whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
          onClick={handleSave}
        >
          {loading ? 'Saving…' : 'Save Parent'}
        </motion.button>
      </div>
    </motion.div>
  )
}
