import type { FC } from 'react'
import { motion } from 'framer-motion'
import { Star, Calendar } from 'lucide-react'
import { listItem } from '@/design-system/animations'
import type { LessonPlanSession, SessionStatus } from '../types'

interface Props {
  session: LessonPlanSession
  onEdit: (session: LessonPlanSession) => void
}

const STATUS_STYLES: Record<SessionStatus, { bg: string; color: string }> = {
  planned:     { bg: 'var(--bg)',                       color: 'var(--muted)' },
  completed:   { bg: 'rgba(16,185,129,0.10)',           color: '#10b981' },
  skipped:     { bg: 'rgba(245,158,11,0.10)',           color: '#f59e0b' },
  rescheduled: { bg: 'rgba(59,130,246,0.10)',           color: '#3b82f6' },
  absent:      { bg: 'rgba(239,68,68,0.10)',            color: 'var(--danger)' },
  cancelled:   { bg: 'rgba(107,114,128,0.10)',          color: 'var(--muted)' },
}

export const SessionRow: FC<Props> = ({ session, onEdit }) => {
  const st = STATUS_STYLES[session.status]

  return (
    <motion.div
      variants={listItem}
      whileHover={{ x: 2, boxShadow: 'var(--shadow-sm)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onEdit(session)}
      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Session number */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        {session.session_number}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {session.is_milestone === 1 && (
            <Star size={11} fill="var(--accent)" stroke="var(--accent)" />
          )}
          <span className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>
            {session.title || `Session ${session.session_number}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Calendar size={10} style={{ color: 'var(--muted)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {session.planned_date ?? 'No date set'}
            {session.session_time ? ` · ${session.session_time.slice(0, 5)}` : ''}
          </span>
        </div>
        {session.skills_arr.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {session.skills_arr.slice(0, 3).map(sk => (
              <span
                key={sk}
                className="text-xs px-1.5 py-0.5 rounded-md capitalize"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {sk}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: status + price */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
          style={{ background: st.bg, color: st.color }}
        >
          {session.status}
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
          {session.price.toFixed(0)} AED
        </span>
      </div>
    </motion.div>
  )
}
