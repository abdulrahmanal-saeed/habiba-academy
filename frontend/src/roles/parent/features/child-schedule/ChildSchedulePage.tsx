import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useChildSchedule } from './hooks/useChildSchedule'
import { pageVariant, stagger, cardVariant } from './animations'
import type { ScheduleSession, SessionStatus } from './types'

const STATUS_STYLE: Record<SessionStatus, { label: string; bg: string; color: string }> = {
  planned:     { label: 'مجدولة',    bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
  rescheduled: { label: 'أُعيد جدولتها', bg: 'rgba(234,179,8,0.1)', color: '#ca8a04' },
  completed:   { label: 'مكتملة',   bg: 'rgba(22,163,74,0.1)',  color: 'var(--success)' },
  skipped:     { label: 'تخطّيت',   bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' },
  absent:      { label: 'غياب',     bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' },
  cancelled:   { label: 'ملغاة',    bg: 'rgba(107,114,128,0.1)', color: 'var(--muted)' },
}

function SessionRow({ session }: { session: ScheduleSession }) {
  const s = STATUS_STYLE[session.status]
  return (
    <motion.div
      variants={cardVariant}
      className="flex items-center gap-3 rounded-2xl p-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        {session.session_number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
          {session.title || `جلسة ${session.session_number}`}
          {session.is_milestone === 1 && (
            <span className="ms-1 text-xs" style={{ color: 'var(--accent)' }}>⭐</span>
          )}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {session.planned_date ?? '—'}{session.session_time ? ` · ${session.session_time.slice(0, 5)}` : ''}
          {' · '}{session.duration_minutes} د
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ background: s.bg, color: s.color }}
      >
        {s.label}
      </span>
    </motion.div>
  )
}

export const ChildSchedulePage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const childId = parseInt(id ?? '0', 10)
  const { data, isLoading, error } = useChildSchedule(childId)

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>تعذّر تحميل الجدول.</p>
      </div>
    )
  }

  const { child, sessions, stats } = data

  return (
    <motion.div variants={pageVariant} initial="hidden" animate="visible" className="flex flex-col gap-5">
      <Link to="/parent" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
        ← العودة
      </Link>

      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{child.full_name}</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{child.level}</p>

        {stats && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
              <span>{stats.done} / {stats.total} جلسة مكتملة</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>{stats.pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
              <span>القادمة: <strong style={{ color: 'var(--ink)' }}>{stats.upcoming}</strong></span>
              <span>المتبقية: <strong style={{ color: 'var(--ink)' }}>{stats.remaining}</strong></span>
            </div>
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>لا توجد جلسات بعد.</p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
          {sessions.map((s) => <SessionRow key={s.id} session={s} />)}
        </motion.div>
      )}
    </motion.div>
  )
}
