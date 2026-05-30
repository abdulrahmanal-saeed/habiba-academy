/* eslint-disable react-refresh/only-export-components */
import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  className?: string
}

export const TooltipProvider = RadixTooltip.Provider

export const Tooltip: FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 400,
  className,
}) => (
  <RadixTooltip.Root delayDuration={delayDuration}>
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        align={align}
        sideOffset={6}
        className={cn(
          'z-[1200] max-w-xs rounded-[var(--radius-sm)] px-3 py-1.5',
          'bg-ink text-surface text-xs font-medium',
          'shadow-[var(--shadow-md)]',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
      >
        {content}
        <RadixTooltip.Arrow className="fill-ink" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  </RadixTooltip.Root>
)
