import { motion } from 'framer-motion'
import type { FC, ReactNode } from 'react'
import { fadeInUp } from '@/design-system/animations'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'py-8 gap-2',
  md: 'py-14 gap-3',
  lg: 'py-20 gap-4',
}

const ICON_SIZE: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-5xl',
}

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
}) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    animate="visible"
    className={cn('flex flex-col items-center justify-center text-center', SIZE[size], className)}
  >
    {icon && (
      <div className={cn('opacity-40', ICON_SIZE[size])} aria-hidden="true">
        {icon}
      </div>
    )}
    <h3 className="font-semibold text-ink">{title}</h3>
    {description && (
      <p className="max-w-xs text-sm text-muted">{description}</p>
    )}
    {action && <div className="mt-1">{action}</div>}
  </motion.div>
)
