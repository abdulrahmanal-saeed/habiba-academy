import { useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Check, X } from 'lucide-react'
import { cardVariant } from '@/design-system/animations'
import type { StudentContract, ContractSavePayload } from '../types'

interface Props {
  contract: StudentContract | null
  studentId: number
  isSaving: boolean
  onSave: (payload: ContractSavePayload) => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export const ContractCard: FC<Props> = ({ contract, studentId, isSaving, onSave }) => {
  const [editing, setEditing] = useState(!contract)
  const [totalHours, setTotalHours] = useState(contract ? String(contract.total_hours) : '')
  const [sessMins, setSessMins] = useState(contract ? String(contract.session_duration_minutes) : '90')
  const [startDate, setStartDate] = useState(contract?.start_date ?? today())
  const [pkgName, setPkgName] = useState(contract?.package_name ?? '')
  const [price, setPrice] = useState(contract ? String(contract.default_price_aed) : '120')
  const [notes, setNotes] = useState(contract?.notes ?? '')

  const totalSessions = totalHours
    ? Math.round(parseFloat(totalHours) / (parseInt(sessMins) / 60))
    : 0

  const inp = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    outline: 'none',
  }

  function handleSave() {
    onSave({
      student_id: studentId,
      total_hours: parseFloat(totalHours),
      session_duration_minutes: parseInt(sessMins),
      start_date: startDate,
      notes,
      package_name: pkgName,
      default_price_aed: parseFloat(price),
    })
    setEditing(false)
  }

  if (!contract && !editing) {
    return (
      <motion.div variants={cardVariant} initial="hidden" animate="visible">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full rounded-2xl p-4 text-sm font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '2px dashed var(--accent)' }}
        >
          + Setup Contract
        </button>
      </motion.div>
    )
  }

  if (editing) {
    return (
      <motion.div
        variants={cardVariant} initial="hidden" animate="visible"
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
            {contract ? 'Edit Contract' : 'Setup Contract'}
          </span>
          {contract && (
            <button type="button" onClick={() => setEditing(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
              <X size={15} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Total Hours *</label>
            <input type="number" min="1" step="0.5" value={totalHours}
              onChange={e => setTotalHours(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Session (min) *</label>
            <select value={sessMins} onChange={e => setSessMins(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm" style={inp}>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Start Date *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Price / session (AED) *</label>
            <input type="number" min="0" step="5" value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Package Name</label>
          <input type="text" value={pkgName} onChange={e => setPkgName(e.target.value)}
            placeholder="e.g. Intensive Arabic"
            className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none" style={inp} />
        </div>
        {totalSessions > 0 && (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            → {totalSessions} sessions × {sessMins} min
          </p>
        )}
        <button type="button" disabled={!totalHours || !startDate || isSaving}
          onClick={handleSave}
          className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold"
          style={{
            background: totalHours && startDate ? 'var(--accent)' : 'var(--border)',
            color: totalHours && startDate ? '#fff' : 'var(--muted)',
            border: 'none',
            cursor: totalHours && startDate ? 'pointer' : 'default',
          }}>
          <Check size={14} />
          {isSaving ? 'Saving…' : 'Save Contract'}
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
            {contract!.package_name || 'Arabic Contract'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {contract!.total_hours}h · {contract!.session_duration_minutes} min sessions
            · {Math.round(contract!.total_hours / (contract!.session_duration_minutes / 60))} total
          </p>
        </div>
        <button type="button" onClick={() => setEditing(true)}
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted)' }}>
          <Edit2 size={12} />
        </button>
      </div>
      <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
        <span>From {contract!.start_date}</span>
        <span>{contract!.default_price_aed} AED / session</span>
      </div>
      {contract!.notes && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{contract!.notes}</p>
      )}
    </motion.div>
  )
}
