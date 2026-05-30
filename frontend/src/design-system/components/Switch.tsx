import * as RadixSwitch from '@radix-ui/react-switch'
import type { FC } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  label?: string
  description?: string
  size?: 'sm' | 'md'
  className?: string
}

const SIZE_ROOT: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-4 w-7',
  md: 'h-5 w-9',
}
const SIZE_THUMB: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-3 w-3 data-[state=checked]:translate-x-3',
  md: 'h-4 w-4 data-[state=checked]:translate-x-4',
}

export const Switch: FC<SwitchProps> = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  label,
  description,
  size = 'md',
  className,
}) => {
  const root = (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'bg-[color:var(--border)] transition-colors',
        'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-[color:var(--accent)]',
        SIZE_ROOT[size],
        className,
      )}
    >
      <RadixSwitch.Thumb
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-sm',
          'translate-x-0 transition-transform duration-200',
          SIZE_THUMB[size],
        )}
      />
    </RadixSwitch.Root>
  )

  if (!label) return root

  return (
    <div className="flex items-center gap-3">
      {root}
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-ink cursor-pointer">
          {label}
        </label>
        {description && (
          <span className="text-xs text-muted">{description}</span>
        )}
      </div>
    </div>
  )
}
