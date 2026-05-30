/* eslint-disable react-refresh/only-export-components */
import * as Radix from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ── Re-export root primitives for composition ─────────────────── */
export const DropdownMenu        = Radix.Root
export const DropdownMenuTrigger = Radix.Trigger
export const DropdownMenuGroup   = Radix.Group
export const DropdownMenuSub     = Radix.Sub
export const DropdownMenuPortal  = Radix.Portal

/* ── Styled content ─────────────────────────────────────────────── */
const CONTENT_BASE = [
  'z-[1100] min-w-[10rem] overflow-hidden rounded-[var(--radius-lg)]',
  'border border-[color:var(--border)] bg-card p-1',
  'shadow-[var(--shadow-lg)]',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
].join(' ')

const ITEM_BASE = [
  'relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)]',
  'px-2 py-1.5 text-sm text-ink outline-none transition-colors gap-2',
  'focus:bg-accent-soft focus:text-accent',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
].join(' ')

export const DropdownMenuContent: FC<Radix.DropdownMenuContentProps> = ({
  className,
  sideOffset = 4,
  ...props
}) => (
  <Radix.Portal>
    <Radix.Content
      sideOffset={sideOffset}
      className={cn(CONTENT_BASE, className)}
      {...props}
    />
  </Radix.Portal>
)

export const DropdownMenuItem: FC<Radix.DropdownMenuItemProps & { inset?: boolean }> = ({
  className,
  inset,
  ...props
}) => (
  <Radix.Item
    className={cn(ITEM_BASE, inset && 'ps-8', className)}
    {...props}
  />
)

export const DropdownMenuCheckboxItem: FC<Radix.DropdownMenuCheckboxItemProps> = ({
  className,
  children,
  checked,
  ...props
}) => (
  <Radix.CheckboxItem
    className={cn(ITEM_BASE, 'pe-2 ps-8', className)}
    checked={checked}
    {...props}
  >
    <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
      <Radix.ItemIndicator>
        <Check size={14} className="text-accent" />
      </Radix.ItemIndicator>
    </span>
    {children}
  </Radix.CheckboxItem>
)

export const DropdownMenuRadioItem: FC<Radix.DropdownMenuRadioItemProps> = ({
  className,
  children,
  ...props
}) => (
  <Radix.RadioItem
    className={cn(ITEM_BASE, 'pe-2 ps-8', className)}
    {...props}
  >
    <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
      <Radix.ItemIndicator>
        <Circle size={8} className="fill-accent text-accent" />
      </Radix.ItemIndicator>
    </span>
    {children}
  </Radix.RadioItem>
)

export const DropdownMenuLabel: FC<Radix.DropdownMenuLabelProps & { inset?: boolean }> = ({
  className,
  inset,
  ...props
}) => (
  <Radix.Label
    className={cn('px-2 py-1.5 text-xs font-semibold text-muted', inset && 'ps-8', className)}
    {...props}
  />
)

export const DropdownMenuSeparator: FC<Radix.DropdownMenuSeparatorProps> = ({
  className,
  ...props
}) => (
  <Radix.Separator
    className={cn('-mx-1 my-1 h-px bg-[color:var(--border-soft)]', className)}
    {...props}
  />
)

export const DropdownMenuSubTrigger: FC<Radix.DropdownMenuSubTriggerProps & { inset?: boolean }> = ({
  className,
  inset,
  children,
  ...props
}) => (
  <Radix.SubTrigger
    className={cn(ITEM_BASE, 'data-[state=open]:bg-accent-soft', inset && 'ps-8', className)}
    {...props}
  >
    {children}
    <ChevronRight size={14} className="ms-auto text-muted" />
  </Radix.SubTrigger>
)

export const DropdownMenuSubContent: FC<Radix.DropdownMenuSubContentProps> = ({
  className,
  ...props
}) => (
  <Radix.SubContent
    className={cn(CONTENT_BASE, className)}
    {...props}
  />
)

export const DropdownMenuRadioGroup: FC<{ value?: string; onValueChange?: (v: string) => void; children: ReactNode }> = (props) => (
  <Radix.RadioGroup {...props} />
)
