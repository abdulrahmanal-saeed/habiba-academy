import { motion } from 'framer-motion'
import type { FC } from 'react'

export interface TourSpotlightProps {
  rect: DOMRect
}

const PADDING = 6

export const TourSpotlight: FC<TourSpotlightProps> = ({ rect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
        borderRadius: 'var(--radius-lg)',
        pointerEvents: 'none',
        zIndex: 10001,
        boxShadow: '0 0 0 3px var(--accent)',
      }}
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: 'inherit',
          boxShadow: '0 0 0 4px var(--accent)',
          opacity: 0.4,
        }}
      />
    </motion.div>
  )
}
