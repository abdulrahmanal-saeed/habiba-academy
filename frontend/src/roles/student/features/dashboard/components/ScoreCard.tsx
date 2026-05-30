import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant } from '@/design-system/animations'
import type { ScoreCardState } from '../types'

export interface ScoreCardProps {
  state: ScoreCardState
  streak: number
}

export const ScoreCard: FC<ScoreCardProps> = ({ state, streak }) => {
  const isScore = state.kind === 'score'

  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Score / status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
            {isScore ? state.label : 'الحالة'}
          </p>
          {isScore ? (
            <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
              {state.score}
              <span className="text-sm font-normal ms-1" style={{ color: 'var(--muted)' }}>
                / {state.total}
              </span>
            </p>
          ) : (
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
              {state.label}
            </p>
          )}
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">🔥</span>
          <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            {streak} يوم
          </p>
        </div>
      </div>

      {/* Progress bar (only for score state) */}
      {isScore && state.total > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((state.score / state.total) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
    </motion.div>
  )
}
