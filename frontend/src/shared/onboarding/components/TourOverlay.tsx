import { motion } from 'framer-motion'
import type { FC } from 'react'

export interface TourOverlayProps {
  rect: DOMRect
  onSkip: () => void
}

const PADDING = 6

export const TourOverlay: FC<TourOverlayProps> = ({ rect, onSkip }) => {
  const x = rect.left - PADDING
  const y = rect.top - PADDING
  const w = rect.width + PADDING * 2
  const h = rect.height + PADDING * 2

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        cursor: 'default',
      }}
      onClick={onSkip}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        onClick={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={8}
              ry={8}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-mask)"
          onClick={onSkip}
          style={{ cursor: 'default' }}
        />
      </svg>
    </motion.div>
  )
}
