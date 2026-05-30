import * as RadixScroll from '@radix-ui/react-scroll-area'
import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ScrollAreaProps {
  children: ReactNode
  className?: string
  maxHeight?: string
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export const ScrollArea: FC<ScrollAreaProps> = ({
  children,
  className,
  maxHeight,
  orientation = 'vertical',
}) => (
  <RadixScroll.Root
    className={cn('relative overflow-hidden', className)}
    style={maxHeight ? { maxHeight } : undefined}
  >
    <RadixScroll.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </RadixScroll.Viewport>

    {(orientation === 'vertical' || orientation === 'both') && (
      <RadixScroll.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none p-0.5 transition-colors hover:bg-[color:var(--border-soft)]"
      >
        <RadixScroll.Thumb className="relative flex-1 rounded-full bg-[color:var(--border)]" />
      </RadixScroll.Scrollbar>
    )}

    {(orientation === 'horizontal' || orientation === 'both') && (
      <RadixScroll.Scrollbar
        orientation="horizontal"
        className="flex h-2 touch-none select-none p-0.5 transition-colors hover:bg-[color:var(--border-soft)]"
      >
        <RadixScroll.Thumb className="relative flex-1 rounded-full bg-[color:var(--border)]" />
      </RadixScroll.Scrollbar>
    )}

    <RadixScroll.Corner />
  </RadixScroll.Root>
)
