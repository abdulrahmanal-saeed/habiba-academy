import type { FC } from 'react'
import { motion } from 'framer-motion'
import { cardVariant } from '@/design-system/animations'
import type { LessonPlanStats } from '../types'

interface Props {
  stats: LessonPlanStats
}

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="text-xs" style={{ color: 'var(--muted)' }}>{label} </span>
    <strong className="text-xs" style={{ color: 'var(--fg)' }}>{value}</strong>
  </div>
)

export const StatsCard: FC<Props> = ({ stats }) => {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - stats.pct / 100)

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-4">
        <svg width={68} height={68} viewBox="0 0 68 68" className="flex-shrink-0">
          <circle cx={34} cy={34} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
          <circle
            cx={34} cy={34} r={r} fill="none"
            stroke="var(--accent)" strokeWidth={6}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 34 34)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x={34} y={38} textAnchor="middle" fontSize={13} fontWeight="bold" fill="var(--fg)">
            {stats.pct}%
          </text>
        </svg>

        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
          <Stat label="Done" value={String(stats.done)} />
          <Stat label="Remaining" value={String(stats.remaining)} />
          <Stat label="Total" value={String(stats.total)} />
          <Stat label="Absent" value={String(stats.absent)} />
          <Stat label="Hours used" value={`${stats.hours_used}h`} />
          <Stat label="Est. finish" value={stats.est_finish ?? '—'} />
        </div>
      </div>

      <div
        className="mt-3 pt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <span>
          <span style={{ color: 'var(--muted)' }}>This month </span>
          <strong style={{ color: 'var(--fg)' }}>
            {stats.month_sessions} sessions · {stats.month_hours}h
          </strong>
        </span>
        <span className="ms-auto">
          <span style={{ color: 'var(--muted)' }}>Total income </span>
          <strong style={{ color: 'var(--accent)' }}>{stats.total_income.toFixed(0)} AED</strong>
        </span>
      </div>
    </motion.div>
  )
}
