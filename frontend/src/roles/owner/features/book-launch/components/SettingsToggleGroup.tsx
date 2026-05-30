import type { FC } from 'react'
import { motion } from 'framer-motion'

export interface ToggleItem {
  key: string
  label: string
  value: boolean
}

interface Props {
  title: string
  items: ToggleItem[]
  onChange: (key: string, value: boolean) => void
}

export const SettingsToggleGroup: FC<Props> = ({ title, items, onChange }) => (
  <div className="mb-3">
    <div className="small fw-semibold mb-2" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {title}
    </div>
    <div className="row g-2">
      {items.map(({ key, label, value }) => (
        <div key={key} className="col-md-6">
          <motion.label
            className="d-flex gap-2 align-items-center p-3 rounded-3 cursor-pointer"
            style={{
              border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
              background: value ? 'var(--accent-soft)' : 'var(--surface-2)',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <motion.div
              style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0, position: 'relative',
                background: value ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
              }}
              animate={{ background: value ? 'var(--accent)' : 'var(--border)' }}
              transition={{ duration: 0.15 }}
              onClick={() => onChange(key, !value)}
            >
              <motion.div
                style={{
                  position: 'absolute', top: 3, width: 16, height: 16,
                  borderRadius: '50%', background: '#fff',
                }}
                animate={{ insetInlineStart: value ? 21 : 3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.div>
            <span
              className="small fw-semibold"
              style={{ color: value ? 'var(--accent)' : 'var(--text)' }}
              onClick={() => onChange(key, !value)}
            >
              {label}
            </span>
          </motion.label>
        </div>
      ))}
    </div>
  </div>
)
