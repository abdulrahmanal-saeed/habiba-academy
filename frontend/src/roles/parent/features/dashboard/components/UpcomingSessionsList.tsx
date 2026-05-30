import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { UpcomingSession } from '../types'
import { sessionStagger, sessionItem } from '../animations'

interface Props {
  sessions: UpcomingSession[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-AE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const SessionRow: FC<{ session: UpcomingSession }> = ({ session }) => (
  <motion.li
    variants={sessionItem}
    className="flex items-start gap-3 py-3"
    style={{ borderBottom: '1px solid var(--border)' }}
  >
    <div
      className="min-w-[56px] flex-shrink-0 rounded-lg px-2 py-1 text-center"
      style={{ background: 'var(--accent-soft)' }}
    >
      <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
        {formatDate(session.planned_date)}
      </div>
      <div className="text-xs" style={{ color: 'var(--accent)' }}>
        {session.planned_time.slice(0, 5)}
      </div>
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
        {session.student_name}
      </p>
      <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>
        {session.duration_minutes} دقيقة
        {session.goals ? ` · ${session.goals}` : ''}
      </p>
    </div>

    {session.status === 'rescheduled' && (
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-xs"
        style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}
      >
        معاد جدولة
      </span>
    )}
  </motion.li>
)

export const UpcomingSessionsList: FC<Props> = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
        لا توجد جلسات قادمة
      </p>
    )
  }

  return (
    <motion.ul
      variants={sessionStagger}
      initial="hidden"
      animate="visible"
      className="list-none p-0 m-0"
    >
      {sessions.map((s) => (
        <SessionRow key={s.id} session={s} />
      ))}
    </motion.ul>
  )
}
