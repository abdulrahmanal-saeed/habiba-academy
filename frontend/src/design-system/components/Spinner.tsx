import { motion } from 'framer-motion'
import type { FC } from 'react'

export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  size?: SpinnerSize
  color?: string
  label?: string
  className?: string
}

const SIZE: Record<SpinnerSize, { box: number; stroke: number }> = {
  sm: { box: 16, stroke: 2 },
  md: { box: 24, stroke: 2.5 },
  lg: { box: 36, stroke: 3 },
}

export const Spinner: FC<SpinnerProps> = ({
  size = 'md',
  color = 'var(--accent)',
  label = 'Loading…',
  className = '',
}) => {
  const { box, stroke } = SIZE[size]
  const r = (box - stroke * 2) / 2
  const cx = box / 2
  const circumference = 2 * Math.PI * r

  return (
    <motion.svg
      role="status"
      aria-label={label}
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      fill="none"
      className={`shrink-0 ${className}`}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeOpacity={0.2}
      />
      {/* Arc */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.75}
      />
    </motion.svg>
  )
}
