import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { BookSubmission, BookSubmissionStatus } from '../types'

const STATUS_COLORS: Record<BookSubmissionStatus, string> = {
  submitted: 'bg-amber-100 text-amber-700',
  feedback_sent: 'bg-green-100 text-green-700',
  needs_correction: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  resubmitted: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-[var(--surface-2)] text-[var(--text-2)]',
  draft: 'bg-[var(--surface-2)] text-[var(--text-3)]',
}

interface Props {
  submission: BookSubmission
  onReview: (s: BookSubmission) => void
}

export const SubmissionRow: FC<Props> = ({ submission: s, onReview }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3"
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-[var(--text-1)]">{s.full_name}</span>
        <span className="text-xs text-[var(--text-3)]">{s.login_code}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
          {s.status.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-[var(--text-2)]">
        {s.book_title} ·{' '}
        {s.unit_type === 'review' ? `Review: ${s.lesson_title}` : `#${s.lesson_number} ${s.lesson_title}`}
      </div>
      <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-3)]">
        <span>Auto: {s.auto_score.toFixed(0)}%</span>
        {s.teacher_score !== null && <span>Teacher: {s.teacher_score.toFixed(0)}%</span>}
        {s.submitted_at && (
          <span>{new Date(s.submitted_at).toLocaleDateString('en-AE')}</span>
        )}
      </div>
    </div>
    <motion.button
      whileHover={{ y: -1 }}
      onClick={() => onReview(s)}
      className="shrink-0 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
    >
      Review
    </motion.button>
  </motion.div>
)
