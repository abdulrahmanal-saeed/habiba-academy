import type { FC, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'circle' | 'rect'
  width?: string | number
  height?: string | number
  lines?: number
}

const BASE = 'animate-pulse rounded-[var(--radius-sm)] bg-[color:var(--accent-soft)]'

export const Skeleton: FC<SkeletonProps> = ({
  variant = 'line',
  width,
  height,
  lines = 1,
  className,
  style,
  ...rest
}) => {
  if (variant === 'circle') {
    const size = width ?? height ?? 40
    return (
      <div
        className={cn(BASE, 'rounded-full', className)}
        style={{ width: size, height: size, ...style }}
        aria-hidden="true"
        {...rest}
      />
    )
  }

  if (lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(BASE, 'h-4')}
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(BASE, variant === 'rect' ? 'rounded-[var(--radius)]' : '', className)}
      style={{ width: width ?? '100%', height: height ?? '1rem', ...style }}
      aria-hidden="true"
      {...rest}
    />
  )
}

export const SkeletonCard: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn('rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-card p-5', className)}
  >
    <div className="flex items-center gap-3">
      <Skeleton variant="circle" width={40} />
      <div className="flex-1">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
    <Skeleton lines={3} className="mt-4" />
  </div>
)
