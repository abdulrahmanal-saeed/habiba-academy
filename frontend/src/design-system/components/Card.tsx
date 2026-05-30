import { motion } from 'framer-motion'
import type { FC, HTMLAttributes } from 'react'
import type { TargetAndTransition } from 'framer-motion'
import { cardVariant } from '@/design-system/animations'

export type CardVariant = 'default' | 'flat' | 'interactive'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  animate?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const VARIANT: Record<CardVariant, { base: string; hover: TargetAndTransition }> = {
  default: {
    base: 'bg-card border border-[color:var(--border)] shadow-[var(--shadow-sm)] rounded-[var(--radius-lg)]',
    hover: { y: -2, boxShadow: 'var(--shadow-md)' },
  },
  flat: {
    base: 'bg-surface border border-[color:var(--border-soft)] rounded-[var(--radius-lg)]',
    hover: { boxShadow: 'var(--shadow-sm)' },
  },
  interactive: {
    base: [
      'bg-card border border-[color:var(--border)] shadow-[var(--shadow-sm)]',
      'rounded-[var(--radius-lg)] cursor-pointer',
    ].join(' '),
    hover: { y: -3, boxShadow: 'var(--shadow-md)', borderColor: 'var(--accent-soft-strong)' },
  },
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card: FC<CardProps> = ({
  variant = 'default',
  animate = true,
  padding = 'md',
  className = '',
  children,
  ...rest
}) => {
  const { base, hover } = VARIANT[variant]
  const isInteractive = variant === 'interactive'

  return (
    <motion.div
      variants={animate ? cardVariant : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
      whileHover={hover}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      className={`${base} ${PADDING[padding]} ${className}`}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.div>
  )
}
