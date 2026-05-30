import type { FC, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
  hint?: string
}

const BASE = [
  'w-full rounded-[var(--radius)] border border-[color:var(--border)] bg-surface px-3 py-2.5',
  'text-sm text-ink placeholder:text-muted',
  'transition-colors resize-y min-h-[80px]',
  'hover:border-[color:var(--accent-soft-strong)]',
  'focus:outline-none focus:border-[color:var(--accent)] focus:shadow-[var(--focus-ring)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

export const Textarea: FC<TextareaProps> = ({
  error,
  label,
  hint,
  id,
  className,
  ...rest
}) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
    )}
    <textarea
      id={id}
      className={cn(
        BASE,
        error && 'border-[color:var(--danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,.18)]',
        className,
      )}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      {...rest}
    />
    {hint && !error && (
      <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
    )}
    {error && (
      <p id={`${id}-error`} className="text-xs text-danger" role="alert">{error}</p>
    )}
  </div>
)
