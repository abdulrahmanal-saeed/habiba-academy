import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger } from '@/design-system/animations'
import { ReviewRow } from './ReviewRow'
import type { ReviewListItem } from '../types'

interface ReviewListProps {
  items: ReviewListItem[]
  onNewReview: () => void
  onEdit: (item: ReviewListItem) => void
  onGrade: (item: ReviewListItem) => void
  onDelete: (item: ReviewListItem) => void
}

export const ReviewList: FC<ReviewListProps> = ({ items, onNewReview, onEdit, onGrade, onDelete }) => {
  const pending = items.filter(i => i.review_status === 'pending')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text-1)]">Reviews</h3>
          {pending.length > 0 && (
            <p className="text-xs text-orange-500 mt-0.5">{pending.length} pending grade{pending.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={onNewReview}
          className="text-sm px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          + New Review
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-3)] text-sm">
          No reviews yet. Create the first one.
        </div>
      ) : (
        <motion.div
          className="space-y-2"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {items.map(item => (
            <ReviewRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onGrade={onGrade}
              onDelete={onDelete}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
