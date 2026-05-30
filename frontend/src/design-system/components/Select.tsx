import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectGroup {
  label?: string
  options: SelectOption[]
}

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options?: SelectOption[]
  groups?: SelectGroup[]
  disabled?: boolean
  error?: boolean
  className?: string
  triggerClassName?: string
  id?: string
}

const TRIGGER_BASE = [
  'flex h-[var(--control-height)] w-full items-center justify-between gap-2 rounded-[var(--radius)] px-3',
  'bg-surface border border-[color:var(--border)] text-sm text-ink',
  'transition-colors cursor-pointer select-none',
  'hover:border-[color:var(--accent-soft-strong)]',
  'focus:outline-none focus:border-[color:var(--accent)] focus:shadow-[var(--focus-ring)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[placeholder]:text-muted',
].join(' ')

const ITEM_BASE = [
  'relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)]',
  'py-1.5 pe-8 ps-2 text-sm text-ink outline-none',
  'data-[highlighted]:bg-accent-soft data-[highlighted]:text-accent',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
].join(' ')

export const Select: FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  placeholder = 'اختر...',
  options,
  groups,
  disabled,
  error,
  className,
  triggerClassName,
  id,
}) => {
  const allGroups: SelectGroup[] = groups ?? (options ? [{ options }] : [])

  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        className={cn(
          TRIGGER_BASE,
          error && 'border-[color:var(--danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,.18)]',
          triggerClassName,
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown size={16} className="shrink-0 text-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={cn(
            'z-[1100] min-w-[var(--radix-select-trigger-width)] overflow-hidden',
            'rounded-[var(--radius-lg)] border border-[color:var(--border)]',
            'bg-card shadow-[var(--shadow-lg)]',
          )}
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-muted">
            <ChevronUp size={14} />
          </RadixSelect.ScrollUpButton>

          <RadixSelect.Viewport className="p-1">
            {allGroups.map((group, gi) => (
              <RadixSelect.Group key={gi}>
                {group.label && (
                  <RadixSelect.Label className="px-2 py-1.5 text-xs font-semibold text-muted">
                    {group.label}
                  </RadixSelect.Label>
                )}
                {group.options.map((opt) => (
                  <RadixSelect.Item
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className={ITEM_BASE}
                  >
                    <RadixSelect.ItemIndicator className="absolute end-2 flex items-center">
                      <Check size={14} className="text-accent" />
                    </RadixSelect.ItemIndicator>
                    <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Group>
            ))}
          </RadixSelect.Viewport>

          <RadixSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-muted">
            <ChevronDown size={14} />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

export interface SelectItemProps {
  value: string
  children: ReactNode
  disabled?: boolean
}

export const SelectItem: FC<SelectItemProps> = ({ value, children, disabled }) => (
  <RadixSelect.Item value={value} disabled={disabled} className={ITEM_BASE}>
    <RadixSelect.ItemIndicator className="absolute end-2 flex items-center">
      <Check size={14} className="text-accent" />
    </RadixSelect.ItemIndicator>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
)
