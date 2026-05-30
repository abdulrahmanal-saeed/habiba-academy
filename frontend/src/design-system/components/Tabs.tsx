import * as RadixTabs from '@radix-ui/react-tabs'
import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: ReactNode
  badge?: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  items: TabItem[]
  children: ReactNode
  variant?: 'underline' | 'pill'
  className?: string
}

export const Tabs: FC<TabsProps> = ({
  value,
  onValueChange,
  items,
  children,
  variant = 'underline',
  className,
}) => (
  <RadixTabs.Root
    value={value}
    onValueChange={onValueChange}
    className={cn('flex flex-col', className)}
  >
    <RadixTabs.List
      className={cn(
        'flex gap-0.5 overflow-x-auto',
        variant === 'underline' && 'border-b border-[color:var(--border)] pb-px',
        variant === 'pill' && 'bg-surface-soft rounded-[var(--radius-lg)] p-1 gap-1',
      )}
      aria-label="Tabs"
    >
      {items.map((item) => (
        <RadixTabs.Trigger
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className={cn(
            'flex shrink-0 items-center gap-1.5 px-4 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
            'disabled:pointer-events-none disabled:opacity-50',
            variant === 'underline' && [
              'h-10 border-b-2 border-transparent rounded-t-[var(--radius-sm)]',
              'text-muted hover:text-ink hover:border-[color:var(--border)]',
              'data-[state=active]:border-[color:var(--accent)] data-[state=active]:text-accent',
            ],
            variant === 'pill' && [
              'h-8 rounded-[var(--radius)] px-3',
              'text-muted hover:text-ink',
              'data-[state=active]:bg-card data-[state=active]:text-accent',
              'data-[state=active]:shadow-[var(--shadow-sm)]',
            ],
          )}
        >
          {item.label}
          {item.badge}
        </RadixTabs.Trigger>
      ))}
    </RadixTabs.List>

    {children}
  </RadixTabs.Root>
)

export const TabPanel: FC<{ value: string; children: ReactNode; className?: string }> = ({
  value,
  children,
  className,
}) => (
  <RadixTabs.Content
    value={value}
    className={cn('mt-4 focus-visible:outline-none', className)}
  >
    {children}
  </RadixTabs.Content>
)
