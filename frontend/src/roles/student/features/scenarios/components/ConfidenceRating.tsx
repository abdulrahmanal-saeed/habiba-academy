import { motion } from 'framer-motion'
import type { FC } from 'react'
import { scaleIn } from '@/design-system/animations'
import { saveRating } from '../utils'
import type { ConfidenceRating } from '../types'

export interface ConfidenceRatingWidgetProps {
  scenarioId: number
  takeNo: number
  onDone: () => void
}

const RATINGS: { value: ConfidenceRating; emoji: string; label: string }[] = [
  { value: 1, emoji: '😐', label: 'Not sure' },
  { value: 2, emoji: '😊', label: 'Pretty good' },
  { value: 3, emoji: '😄', label: 'Confident!' },
]

export const ConfidenceRatingWidget: FC<ConfidenceRatingWidgetProps> = ({
  scenarioId,
  takeNo,
  onDone,
}) => {
  function handleRate(rating: ConfidenceRating): void {
    saveRating(scenarioId, takeNo, rating)
    onDone()
  }

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className="mt-4 pt-4"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>
        How confident were you? 🤔
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        {RATINGS.map((r) => (
          <motion.button
            key={r.value}
            type="button"
            onClick={() => handleRate(r.value)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border font-medium"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--fg)' }}
          >
            {r.emoji} {r.label}
          </motion.button>
        ))}
      </div>
      <button
        type="button"
        onClick={onDone}
        className="text-xs underline"
        style={{ color: 'var(--muted)' }}
      >
        skip and reload
      </button>
    </motion.div>
  )
}
