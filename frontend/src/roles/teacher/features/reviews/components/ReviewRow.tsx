import { motion } from 'framer-motion'
import type { FC } from 'react'
import { listItem } from '@/design-system/animations'
import type { ReviewListItem } from '../types'

interface ReviewRowProps {
  item: ReviewListItem
  onEdit: (item: ReviewListItem) => void
  onGrade: (item: ReviewListItem) => void
  onDelete: (item: ReviewListItem) => void
}

const TYPE_LABELS: Record<string, string> = {
  weekly_review: 'Weekly',
  monthly_review: 'Monthly',
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-[var(--surface-2)] text-[var(--text-2)]',
  published: 'bg-green-100 text-green-700',
  closed:    'bg-[var(--surface-3)] text-[var(--text-3)]',
  scheduled: 'bg-yellow-100 text-yellow-700',
}

export const ReviewRow: FC<ReviewRowProps> = ({ item, onEdit, onGrade, onDelete }) => {
  const hasSub = item.submission_id !== null
  const isPending = item.review_status === 'pending'
  const isReviewed = item.review_status === 'reviewed'
  const scoreLabel = hasSub
    ? `${item.total_score ?? '–'} / ${item.total_points}`
    : `– / ${item.total_points}`

  return (
    <motion.div
      variants={listItem}
      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-[var(--text-1)] truncate">{item.title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-white shrink-0">
            {TYPE_LABELS[item.review_type] ?? item.review_type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[item.status] ?? ''}`}>
            {item.status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-3)]">
          <span>{item.review_date}</span>
          <span>{scoreLabel} pts</span>
          {hasSub && (
            <span className={isPending ? 'text-orange-500 font-medium' : 'text-green-600 font-medium'}>
              {isPending ? 'Needs grading' : isReviewed ? 'Reviewed' : item.review_status}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasSub && isPending && (
          <button
            onClick={() => onGrade(item)}
            className="text-xs px-2.5 py-1 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            Grade
          </button>
        )}
        {hasSub && isReviewed && (
          <button
            onClick={() => onGrade(item)}
            className="text-xs px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] transition-colors"
          >
            View
          </button>
        )}
        {!hasSub && (
          <button
            onClick={() => onEdit(item)}
            className="text-xs px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] transition-colors"
          >
            Edit
          </button>
        )}
        <button
          onClick={() => onDelete(item)}
          className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
