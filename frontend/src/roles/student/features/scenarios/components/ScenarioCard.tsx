import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Mic, Clock, ChevronRight } from 'lucide-react'
import { cardVariant } from '@/design-system/animations'
import type { Scenario } from '../types'

export interface ScenarioCardProps {
  scenario: Scenario
  onClick: () => void
}

function isToday(scDate: string): boolean {
  return new Date().toISOString().slice(0, 10) === scDate
}

export const ScenarioCard: FC<ScenarioCardProps> = ({ scenario, onClick }) => {
  const today = isToday(scenario.sc_date)
  const hasRecordings = scenario.recording_count > 0

  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      className="rounded-xl p-4 cursor-pointer flex items-start gap-3"
      style={{
        background: 'var(--card)',
        border: today ? '2px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--accent-soft)' }}
      >
        <Mic size={18} color="var(--accent)" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--fg)' }}>
            {scenario.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {today && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                Today
              </span>
            )}
            {!today && !hasRecordings && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
              >
                New
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {new Date(scenario.sc_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
            <Clock size={11} />
            {scenario.time_limit_seconds}s
          </span>
          {hasRecordings && (
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              {scenario.recording_count} take{scenario.recording_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} style={{ color: 'var(--muted)', marginTop: 2, flexShrink: 0 }} />
    </motion.div>
  )
}
