import * as RadixSeparator from '@radix-ui/react-separator'
import type { FC } from 'react'
import { cn } from '@/lib/utils'

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  className?: string
  label?: string
}

export const Separator: FC<SeparatorProps> = ({
  orientation = 'horizontal',
  decorative = true,
  className,
  label,
}) => {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <RadixSeparator.Root
          decorative
          orientation="horizontal"
          className="flex-1 h-px bg-[color:var(--border-soft)]"
        />
        <span className="shrink-0 text-xs text-muted">{label}</span>
        <RadixSeparator.Root
          decorative
          orientation="horizontal"
          className="flex-1 h-px bg-[color:var(--border-soft)]"
        />
      </div>
    )
  }

  return (
    <RadixSeparator.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        'bg-[color:var(--border-soft)]',
        className,
      )}
    />
  )
}
