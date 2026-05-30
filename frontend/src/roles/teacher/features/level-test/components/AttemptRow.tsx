import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { LevelTestAttempt } from '../types'

interface Props {
  attempt: LevelTestAttempt
  onGrade: (attempt: LevelTestAttempt) => void
}

export const AttemptRow: FC<Props> = ({ attempt, onGrade }) => {
  const isPending = attempt.review_status === 'pending'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-[var(--text-1)]">{attempt.full_name}</div>
        <div className="mt-0.5 text-xs text-[var(--text-2)]">
          {attempt.created_at?.slice(0, 10)}
          {attempt.country && ` · ${attempt.country}`}
          {attempt.auto_score != null && (
            <span className="ms-2 font-medium text-[var(--accent)]">
              Auto: {attempt.auto_score}/55
            </span>
          )}
          {attempt.final_level && (
            <span className="ms-2 font-bold text-[var(--text-1)]">{attempt.final_level}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isPending
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {isPending ? 'Pending' : 'Reviewed'}
        </span>

        <motion.button
          whileHover={{ y: -1 }}
          onClick={() => onGrade(attempt)}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
            isPending
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--surface-2)] text-[var(--text-2)]'
          }`}
        >
          {isPending ? 'Grade' : 'View'}
        </motion.button>
      </div>
    </motion.div>
  )
}
