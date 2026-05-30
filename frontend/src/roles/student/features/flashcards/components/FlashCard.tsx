import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { FC } from 'react'
import { Eye } from 'lucide-react'
import { scaleIn, fadeInUp } from '@/design-system/animations'
import type { FlashCard as FlashCardType } from '../types'

const TYPE_LABEL: Record<string, string> = {
  word:    'Practice Word',
  mistake: 'Common Mistake',
}

interface FlashCardProps {
  card: FlashCardType
  index: number
  total: number
}

export const FlashCard: FC<FlashCardProps> = ({ card, index, total }) => {
  const [revealed, setRevealed] = useState(false)

  return (
    <motion.div
      key={card.id}
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: '280px' }}
    >
      {/* Counter + type badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {TYPE_LABEL[card.card_type] ?? card.card_type}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* Front */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <div className="text-3xl font-black" style={{ color: 'var(--accent)' }}>
          {card.front}
        </div>

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.button
              key="reveal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold mt-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--fg)',
              }}
            >
              <Eye size={14} /> Reveal
            </motion.button>
          ) : (
            <motion.div
              key="back"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2 w-full mt-2"
            >
              {card.back && (
                <p
                  className="text-base leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--fg)' }}
                >
                  {card.back}
                </p>
              )}
              {card.hint && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {card.hint}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint: due/review info */}
      {card.review_count > 0 && (
        <div className="text-xs text-center" style={{ color: 'var(--muted)' }}>
          Reviewed {card.review_count} time{card.review_count !== 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  )
}
