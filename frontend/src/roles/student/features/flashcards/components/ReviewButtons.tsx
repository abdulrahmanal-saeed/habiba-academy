import { motion } from 'framer-motion'
import type { FC } from 'react'
import { buttonTap } from '@/design-system/animations'
import type { ReviewState } from '../types'

interface ReviewButtonsProps {
  onRate: (state: ReviewState) => void
  disabled: boolean
}

const BUTTONS: Array<{ state: ReviewState; label: string; bg: string; color: string }> = [
  { state: 'got_it', label: 'Got it ✓',    bg: 'var(--success)',       color: '#fff' },
  { state: 'almost', label: 'Almost',       bg: 'var(--warning)',       color: '#fff' },
  { state: 'missed', label: 'Missed it ✗', bg: 'var(--danger)',        color: '#fff' },
]

export const ReviewButtons: FC<ReviewButtonsProps> = ({ onRate, disabled }) => (
  <div className="flex flex-wrap justify-center gap-3 mt-4">
    {BUTTONS.map(({ state, label, bg, color }) => (
      <motion.button
        key={state}
        type="button"
        {...buttonTap}
        onClick={() => onRate(state)}
        disabled={disabled}
        className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: bg, color }}
      >
        {label}
      </motion.button>
    ))}
  </div>
)
