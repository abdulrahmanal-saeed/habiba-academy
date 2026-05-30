import type { FC, HTMLAttributes } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

const VARIANT_STYLE: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'var(--success-bg)', color: 'var(--success)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  danger:  { bg: 'var(--danger-bg)',  color: 'var(--danger)'  },
  info:    { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  neutral: { bg: 'var(--accent-soft)', color: 'var(--ink-soft)' },
}

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

const DOT_COLOR: Record<BadgeVariant, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  info:    'var(--info)',
  neutral: 'var(--muted)',
}

export const Badge: FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  children,
  style,
  ...rest
}) => {
  const { bg, color } = VARIANT_STYLE[variant]

  return (
    <span
      style={{ background: bg, color, ...style }}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${SIZE_CLASS[size]} ${className}`}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{ background: DOT_COLOR[variant] }}
          className="h-1.5 w-1.5 rounded-full shrink-0"
        />
      )}
      {children}
    </span>
  )
}
