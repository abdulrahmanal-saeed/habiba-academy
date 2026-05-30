import type { FC } from 'react'
import { motion } from 'framer-motion'
import { stagger } from '@/design-system/animations'
import type { LessonPlanSession, SessionStatus } from '../types'
import { SessionRow } from './SessionRow'

interface Props {
  sessions: LessonPlanSession[]
  onEdit: (session: LessonPlanSession) => void
}

interface Group {
  label: string
  statuses: SessionStatus[]
  sessions: LessonPlanSession[]
}

function groupSessions(sessions: LessonPlanSession[]): Group[] {
  return [
    {
      label: 'Upcoming',
      statuses: ['planned', 'rescheduled'] as SessionStatus[],
      sessions: sessions.filter(s => s.status === 'planned' || s.status === 'rescheduled'),
    },
    {
      label: 'Completed',
      statuses: ['completed'] as SessionStatus[],
      sessions: sessions.filter(s => s.status === 'completed'),
    },
    {
      label: 'Other',
      statuses: ['skipped', 'absent', 'cancelled'] as SessionStatus[],
      sessions: sessions.filter(s => s.status === 'skipped' || s.status === 'absent' || s.status === 'cancelled'),
    },
  ].filter(g => g.sessions.length > 0)
}

export const SessionList: FC<Props> = ({ sessions, onEdit }) => {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
        No sessions yet. Save the contract to generate session slots.
      </p>
    )
  }

  const groups = groupSessions(sessions)

  return (
    <div className="flex flex-col gap-4">
      {groups.map(group => (
        <div key={group.label}>
          <h3
            className="text-xs font-semibold mb-2 ps-1"
            style={{ color: 'var(--muted)' }}
          >
            {group.label} ({group.sessions.length})
          </h3>
          <motion.div
            variants={stagger} initial="hidden" animate="visible"
            className="flex flex-col gap-2"
          >
            {group.sessions.map(s => (
              <SessionRow key={s.id} session={s} onEdit={onEdit} />
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  )
}
