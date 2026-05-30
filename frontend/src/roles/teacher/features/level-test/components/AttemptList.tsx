import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import type { LevelTestAttempt, LevelTestReviewStatus } from '../types'
import { AttemptRow } from './AttemptRow'
import { levelTestApi } from '../api'

type Filter = LevelTestReviewStatus | 'all'

interface Props {
  attempts: LevelTestAttempt[]
  pendingCount: number
  isLoading: boolean
  filter: Filter
  onFilterChange: (f: Filter) => void
  onGrade: (attempt: LevelTestAttempt) => void
}

export const AttemptList: FC<Props> = ({
  attempts,
  pendingCount,
  isLoading,
  filter,
  onFilterChange,
  onGrade,
}) => {
  const handleExport = () => {
    window.open(levelTestApi.getExportUrl(), '_blank')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(['all', 'pending', 'reviewed'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'pending' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : 'Reviewed'}
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ y: -1 }}
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-medium text-[var(--text-1)]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </motion.button>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-sm text-[var(--text-3)]">Loading…</div>
      )}

      {!isLoading && attempts.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-3)]">
          No attempts found.
        </div>
      )}

      <AnimatePresence initial={false}>
        {attempts.map((a) => (
          <AttemptRow key={a.id} attempt={a} onGrade={onGrade} />
        ))}
      </AnimatePresence>
    </div>
  )
}
