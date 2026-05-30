import { motion } from 'framer-motion'
import type { FC, ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop'
  > {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  as?: 'button' | 'a'
  href?: string
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target']
  rel?: string
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium cursor-pointer ' +
  'select-none transition-colors ' +
  'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ' +
  'disabled:opacity-[62%] disabled:pointer-events-none disabled:cursor-not-allowed'

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-11 px-4 text-base rounded-[var(--radius)]',
  lg: 'h-[52px] px-6 text-lg rounded-[var(--radius-lg)]',
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent text-white font-semibold',
    'hover:bg-accent-hover',
    'shadow-[var(--shadow-sm)]',
  ].join(' '),

  secondary: [
    'bg-transparent border-2 border-accent text-accent font-semibold',
    'hover:bg-accent-soft',
  ].join(' '),

  ghost: [
    'bg-transparent text-accent',
    'hover:bg-accent-soft',
  ].join(' '),

  danger: [
    'bg-danger text-white font-semibold',
    'hover:opacity-90',
    'shadow-[var(--shadow-sm)]',
  ].join(' '),

  link: [
    'bg-transparent text-accent',
    'hover:underline underline-offset-4',
    'h-auto px-0 rounded-none',
  ].join(' '),
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  as,
  href,
  target,
  rel,
  ...rest
}) => {
  const sizeClass = variant !== 'link' ? SIZE[size] : ''
  const isDisabled = disabled ?? isLoading
  const cls = `${BASE} ${sizeClass} ${VARIANT[variant]} ${className}`
  const motionProps = {
    whileHover: isDisabled ? undefined : { y: variant !== 'link' ? -1 : 0 },
    whileTap: isDisabled ? undefined : { scale: variant !== 'link' ? 0.97 : 1 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
    className: cls,
  }

  const inner = (
    <>
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </>
  )

  if (as === 'a' || href) {
    return (
      <motion.a href={href} target={target} rel={rel} {...motionProps}>
        {inner}
      </motion.a>
    )
  }

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...motionProps}
      {...(rest as Record<string, unknown>)}
    >
      {inner}
    </motion.button>
  )
}
