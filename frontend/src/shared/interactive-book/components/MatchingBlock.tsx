import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger, listItem } from '@/design-system/animations'
import type { MatchingItem } from '../types'

export interface MatchingBlockProps {
  title: string
  hint?: string
  questionType: string
  items: MatchingItem[]
  options: string[]
  answers: Record<string, string>
  onChange: (itemId: string, value: string) => void
  readonly?: boolean
}

export const MatchingBlock: FC<MatchingBlockProps> = ({
  title,
  hint,
  questionType,
  items,
  options,
  answers,
  onChange,
  readonly = false,
}) => {
  if (!items.length) return null

  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      animate="visible"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem',
        marginBottom: '1rem',
      }}
    >
      <h2
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: hint ? '0.25rem' : '1rem',
        }}
      >
        {title}
      </h2>
      {hint && (
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          {hint}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {items.map((item) => {
          const saved = answers[item.id] ?? ''
          return (
            <motion.div key={item.id} variants={listItem}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  direction: 'rtl',
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  marginBottom: '0.25rem',
                }}
              >
                {item.arabic}
              </label>
              <select
                value={saved}
                disabled={readonly}
                onChange={(e) => onChange(item.id, e.target.value)}
                aria-label={`Match for ${item.arabic}`}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${saved ? 'var(--accent)' : 'var(--border)'}`,
                  background: saved ? 'var(--accent-soft)' : 'var(--surface)',
                  color: 'var(--ink)',
                  fontSize: '0.875rem',
                  cursor: readonly ? 'default' : 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                data-type={questionType}
              >
                <option value="">Select meaning</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
