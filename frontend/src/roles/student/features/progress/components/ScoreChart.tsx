import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { ScoreHistoryItem } from '../types'

function barColor(pct: number): string {
  if (pct >= 80) return 'var(--success)'
  if (pct >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

interface ScoreChartProps {
  history: ScoreHistoryItem[]
}

export const ScoreChart: FC<ScoreChartProps> = ({ history }) => {
  if (history.length === 0) return null

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="font-bold mb-0.5" style={{ color: 'var(--fg)' }}>
        MCQ Score History
      </div>
      <div className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        Last {history.length} graded homework{history.length !== 1 ? 's' : ''}
      </div>

      <div className="flex items-end gap-1.5 h-20 px-1">
        {history.map((row, i) => {
          const pct  = Math.round((row.mcq_score / row.mcq_total) * 100)
          const barH = Math.max(4, Math.round(pct * 0.72))
          const color = barColor(pct)
          const label = `${row.title} — ${pct}%`

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 flex-1 min-w-0"
              title={label}
            >
              <div
                className="w-full rounded-t-sm transition-opacity hover:opacity-100 opacity-85"
                style={{ height: `${barH}px`, background: color, minHeight: '4px' }}
              />
              <span className="text-[0.55rem] font-semibold" style={{ color: 'var(--muted)' }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2" style={{ borderTop: '1px solid var(--border)' }} />
    </motion.div>
  )
}
