import { useState } from 'react'
import type { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { scaleIn } from '@/design-system/animations'
import type { LessonPlanSession, SessionStatus } from '../types'

interface Props {
  session: LessonPlanSession
  isLoading: boolean
  onSetStatus: (
    id: number,
    status: SessionStatus,
    extra?: { actual_date?: string; planned_date?: string },
  ) => void
}

const STATUSES: { value: SessionStatus; label: string }[] = [
  { value: 'planned',     label: 'Planned' },
  { value: 'completed',   label: 'Completed' },
  { value: 'skipped',     label: 'Skipped' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'absent',      label: 'Absent (50% fee)' },
  { value: 'cancelled',   label: 'Cancelled' },
]

export const SessionStatusMenu: FC<Props> = ({ session, isLoading, onSetStatus }) => {
  const [open, setOpen] = useState(false)
  const [reschedDate, setReschedDate] = useState('')
  const [pendingReschedule, setPendingReschedule] = useState(false)

  function pick(status: SessionStatus) {
    setOpen(false)
    if (status === 'absent') {
      if (!window.confirm('Mark as absent? This charges 50% of the session fee immediately and cannot be undone easily.')) return
      onSetStatus(session.id, status)
      return
    }
    if (status === 'rescheduled') {
      setPendingReschedule(true)
      return
    }
    onSetStatus(session.id, status)
  }

  if (pendingReschedule) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={reschedDate}
          onChange={e => setReschedDate(e.target.value)}
          className="rounded-lg px-2 py-1 text-xs"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
        />
        <button
          type="button"
          disabled={!reschedDate || isLoading}
          onClick={() => {
            onSetStatus(session.id, 'rescheduled', { planned_date: reschedDate })
            setPendingReschedule(false)
          }}
          className="text-xs px-2 py-1 rounded-lg font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {isLoading ? '…' : 'Set'}
        </button>
        <button
          type="button"
          onClick={() => setPendingReschedule(false)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={isLoading}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg capitalize"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer' }}
      >
        {session.status} <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={scaleIn} initial="hidden" animate="visible" exit="hidden"
            className="absolute end-0 top-8 z-50 rounded-xl overflow-hidden min-w-max"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            {STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => pick(s.value)}
                className="w-full text-start px-3 py-2 text-xs"
                style={{
                  background: s.value === session.status ? 'var(--accent-soft)' : 'none',
                  color: s.value === session.status ? 'var(--accent)' : 'var(--fg)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
