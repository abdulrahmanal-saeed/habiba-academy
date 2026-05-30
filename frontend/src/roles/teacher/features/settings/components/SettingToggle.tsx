import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { SettingDefinition } from '../types'

interface SettingToggleProps {
  definition: SettingDefinition
  value: string
  onChange: (key: string, value: string) => void
  disabled?: boolean
}

export const SettingToggle: FC<SettingToggleProps> = ({ definition, value, onChange, disabled }) => {
  const enabled = value === '1' || value === 'true'

  function toggle(): void {
    if (disabled) return
    onChange(definition.key, enabled ? '0' : '1')
  }

  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex-1 min-w-0 me-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{definition.label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{definition.description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={definition.label}
        onClick={toggle}
        disabled={disabled}
        className="relative flex-shrink-0"
        style={{
          width: 40, height: 22,
          borderRadius: 11,
          background: enabled ? 'var(--accent)' : 'var(--border)',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          padding: 0,
          transition: 'background 0.2s',
        }}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute',
            top: 3,
            width: 16, height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  )
}
