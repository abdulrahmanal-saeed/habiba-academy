import * as RadixProgress from '@radix-ui/react-progress'
import type { FC } from 'react'
import { cn } from '@/lib/utils'

export type ProgressVariant = 'default' | 'success' | 'warning' | 'danger'
export type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressProps {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: ProgressSize
  showLabel?: boolean
  label?: string
  className?: string
}

const TRACK_H: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const FILL_COLOR: Record<ProgressVariant, string> = {
  default: 'bg-[color:var(--accent)]',
  success: 'bg-[color:var(--success)]',
  warning: 'bg-[color:var(--warning)]',
  danger:  'bg-[color:var(--danger)]',
}

export const Progress: FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  className,
}) => {
  const pct = Math.round(Math.min(Math.max(value, 0), max) / max * 100)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{label}</span>
          {showLabel && <span className="font-medium text-ink">{pct}%</span>}
        </div>
      )}
      <RadixProgress.Root
        value={value}
        max={max}
        className={cn(
          'w-full overflow-hidden rounded-full bg-[color:var(--accent-soft)]',
          TRACK_H[size],
        )}
        aria-label={label ?? `${pct}%`}
      >
        <RadixProgress.Indicator
          className={cn('h-full rounded-full transition-all duration-500 ease-out', FILL_COLOR[variant])}
          style={{ transform: `translateX(${100 - pct}%)` }}
        />
      </RadixProgress.Root>
    </div>
  )
}
