import { AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import type { BookSubmission, BookSubmissionStatus } from '../types'
import { SubmissionRow } from './SubmissionRow'

type StatusFilter = BookSubmissionStatus | 'all'

interface Props {
  submissions: BookSubmission[]
  isLoading: boolean
  statusFilter: StatusFilter
  searchQ: string
  onStatusChange: (s: StatusFilter) => void
  onSearchChange: (q: string) => void
  onReview: (s: BookSubmission) => void
}

const FILTERS: StatusFilter[] = ['all', 'submitted', 'needs_correction', 'feedback_sent', 'completed']

export const SubmissionList: FC<Props> = ({
  submissions, isLoading, statusFilter, searchQ,
  onStatusChange, onSearchChange, onReview,
}) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={searchQ}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search student, code, book, lesson…"
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] sm:w-64"
      />
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onStatusChange(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === f
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
            }`}
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>

    {isLoading && (
      <div className="py-8 text-center text-sm text-[var(--text-3)]">Loading…</div>
    )}

    {!isLoading && submissions.length === 0 && (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-3)]">
        No submissions found.
      </div>
    )}

    <AnimatePresence initial={false}>
      {submissions.map((s) => (
        <SubmissionRow key={s.id} submission={s} onReview={onReview} />
      ))}
    </AnimatePresence>
  </div>
)
