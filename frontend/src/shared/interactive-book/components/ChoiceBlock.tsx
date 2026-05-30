import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger, listItem } from '@/design-system/animations'
import type { ChoiceQuestion } from '../types'

export interface ChoiceBlockProps {
  title: string
  hint?: string
  questionType: string
  questions: ChoiceQuestion[]
  answers: Record<string, string>
  onChange: (questionId: string, value: string) => void
  readonly?: boolean
}

export const ChoiceBlock: FC<ChoiceBlockProps> = ({
  title,
  hint,
  questionType,
  questions,
  answers,
  onChange,
  readonly = false,
}) => {
  if (!questions.length) return null

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

      {questions.map((q) => {
        const saved = answers[q.id] ?? ''
        return (
          <motion.div key={q.id} variants={listItem} style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '0.5rem',
                direction: 'rtl',
                lineHeight: 1.7,
              }}
            >
              {q.question}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {Object.entries(q.options).map(([letter, text]) => {
                const checked = saved === letter
                return (
                  <label
                    key={letter}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: readonly ? 'default' : 'pointer',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: checked ? 'var(--accent-soft)' : 'transparent',
                      border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-soft)'}`,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name={`${questionType}-${q.id}`}
                      value={letter}
                      checked={checked}
                      disabled={readonly}
                      onChange={() => onChange(q.id, letter)}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                    <span style={{ color: 'var(--ink)', fontSize: '0.9rem' }}>
                      <strong>{letter}.</strong> {text}
                    </span>
                  </label>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </motion.section>
  )
}
