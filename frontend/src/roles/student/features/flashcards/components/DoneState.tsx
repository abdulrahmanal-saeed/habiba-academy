import { motion } from 'framer-motion'
import type { FC } from 'react'
import { scaleIn } from '@/design-system/animations'

interface DoneStateProps {
  message: string
}

export const DoneState: FC<DoneStateProps> = ({ message }) => (
  <motion.div
    variants={scaleIn}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center gap-3 py-16 text-center"
  >
    <span className="text-5xl">✅</span>
    <p className="font-semibold text-lg" style={{ color: 'var(--fg)' }}>
      {message}
    </p>
    <p className="text-sm" style={{ color: 'var(--muted)' }}>
      Come back tomorrow for your next review.
    </p>
  </motion.div>
)
