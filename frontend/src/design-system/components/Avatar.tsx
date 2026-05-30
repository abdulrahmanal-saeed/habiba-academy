import { useState } from 'react'
import type { FC } from 'react'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  src?: string
  name?: string
  alt?: string
  size?: AvatarSize
  className?: string
}

const SIZE: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'h-8 w-8 text-xs',   text: 'text-xs'  },
  md: { container: 'h-10 w-10 text-sm',  text: 'text-sm'  },
  lg: { container: 'h-14 w-14 text-base', text: 'text-base' },
  xl: { container: 'h-20 w-20 text-xl',  text: 'text-xl'  },
}

/* Deterministic background from name — cycles through brand palette */
const BG_PALETTE = [
  { bg: 'var(--accent)',      fg: 'white' },
  { bg: 'var(--accent-2)',    fg: 'white' },
  { bg: 'var(--accent-mint)', fg: 'var(--ink)' },
  { bg: 'var(--success)',     fg: 'white' },
  { bg: 'var(--info)',        fg: 'white' },
  { bg: 'var(--warning)',     fg: 'white' },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function pickPalette(name: string) {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return BG_PALETTE[code % BG_PALETTE.length]
}

export const Avatar: FC<AvatarProps> = ({
  src,
  name = '',
  alt,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false)
  const showImage = !!src && !imgError
  const initials = name ? getInitials(name) : '?'
  const palette = pickPalette(name || '?')
  const { container } = SIZE[size]

  const base = `inline-flex items-center justify-center rounded-full shrink-0 font-semibold select-none overflow-hidden ${container} ${className}`

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt ?? name}
        onError={() => setImgError(true)}
        className={`${base} object-cover`}
      />
    )
  }

  return (
    <span
      aria-label={alt ?? name}
      role="img"
      style={{ background: palette.bg, color: palette.fg }}
      className={base}
    >
      {initials}
    </span>
  )
}
