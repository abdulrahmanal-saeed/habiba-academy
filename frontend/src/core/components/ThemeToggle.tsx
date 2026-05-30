import { motion } from 'framer-motion'
import { Moon, Sun, Monitor } from 'lucide-react'
import type { FC } from 'react'
import { useTheme } from '@/core/hooks/useTheme'
import { Tooltip } from '@/design-system/components/Tooltip'
import { cn } from '@/lib/utils'
import type { Theme } from '@/core/stores/themeStore'

const MODES: { value: Theme; Icon: typeof Sun; label: string }[] = [
  { value: 'light',  Icon: Sun,     label: 'Light mode' },
  { value: 'dark',   Icon: Moon,    label: 'Dark mode' },
  { value: 'system', Icon: Monitor, label: 'System default' },
]

interface ThemeToggleProps {
  /** 'icon' = cycle button. 'group' = 3-way selector strip. */
  variant?: 'icon' | 'group'
  className?: string
}

export const ThemeToggle: FC<ThemeToggleProps> = ({ variant = 'icon', className }) => {
  const { theme, setTheme, toggle, isDark } = useTheme()

  if (variant === 'group') {
    return (
      <div
        className={cn(
          'flex items-center rounded-[var(--radius-lg)] border border-[color:var(--border)]',
          'bg-surface-soft p-0.5',
          className,
        )}
        role="radiogroup"
        aria-label="Theme"
      >
        {MODES.map(({ value, Icon, label }) => {
          const active = theme === value
          return (
            <Tooltip key={value} content={label} side="bottom">
              <motion.button
                type="button"
                role="radio"
                aria-checked={active}
                whileTap={{ scale: 0.92 }}
                onClick={() => setTheme(value)}
                className={cn(
                  'relative flex h-7 w-7 items-center justify-center rounded-[var(--radius)]',
                  'transition-colors focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
                  active
                    ? 'bg-card text-accent shadow-[var(--shadow-sm)]'
                    : 'text-muted hover:text-ink',
                )}
                aria-label={label}
              >
                <Icon size={14} />
              </motion.button>
            </Tooltip>
          )
        })}
      </div>
    )
  }

  return (
    <Tooltip content={isDark ? 'Switch to light' : 'Switch to dark'} side="bottom">
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[var(--radius)]',
          'text-muted transition-colors hover:bg-accent-soft hover:text-ink',
          'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
          className,
        )}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 30, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </motion.div>
      </motion.button>
    </Tooltip>
  )
}
