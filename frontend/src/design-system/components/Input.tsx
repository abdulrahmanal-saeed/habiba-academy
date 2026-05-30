import { useState, useId } from 'react'
import type { FC, InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff, Search } from 'lucide-react'

export type InputVariant = 'text' | 'password' | 'search'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  variant?: InputVariant
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  wrapperClassName?: string
}

const INPUT_BASE = [
  'w-full bg-surface text-ink placeholder:text-muted',
  'border rounded-[var(--radius)] outline-none',
  'transition-[border-color,box-shadow] duration-200',
  'h-11 px-4 text-base',
  'focus:border-accent focus:shadow-[var(--focus-ring)]',
  'disabled:opacity-[62%] disabled:cursor-not-allowed',
].join(' ')

const INPUT_ERROR = 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(220,38,38,.18)]'
const INPUT_NORMAL = 'border-[color:var(--border)]'

export const Input: FC<InputProps> = ({
  variant = 'text',
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  wrapperClassName = '',
  className = '',
  id: externalId,
  disabled,
  ...rest
}) => {
  const generatedId = useId()
  const id = externalId ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const [showPassword, setShowPassword] = useState(false)

  const isPassword = variant === 'password'
  const isSearch = variant === 'search'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : isSearch ? 'search' : 'text'

  const hasStartIcon = isSearch || !!leftIcon
  const hasEndIcon = isPassword || !!rightIcon

  const ariaDescribedBy = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink-soft"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Inline-start icon (search or custom) */}
        {hasStartIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute start-3 text-muted"
          >
            {isSearch ? <Search size={16} /> : leftIcon}
          </span>
        )}

        <input
          id={id}
          type={inputType}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          className={[
            INPUT_BASE,
            error ? INPUT_ERROR : INPUT_NORMAL,
            hasStartIcon ? 'ps-10' : '',
            hasEndIcon ? 'pe-10' : '',
            className,
          ].join(' ')}
          {...rest}
        />

        {/* Inline-end icon (password toggle or custom) */}
        {hasEndIcon && (
          <span className="absolute end-3 flex items-center text-muted">
            {isPassword ? (
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
                className="cursor-pointer text-muted hover:text-ink transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ) : (
              <span aria-hidden="true">{rightIcon}</span>
            )}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
