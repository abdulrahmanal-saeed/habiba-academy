import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'

export interface WritingBlockProps {
  title: string
  instructions?: string
  placeholder?: string
  minSentences?: number
  value: string
  onChange: (value: string) => void
  readonly?: boolean
}

function countSentences(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(/[.!?\n؟]+/).filter((s) => s.trim().length > 0).length
}

export const WritingBlock: FC<WritingBlockProps> = ({
  title,
  instructions,
  placeholder = 'اكتب إجابتك بالعربية...',
  minSentences = 3,
  value,
  onChange,
  readonly = false,
}) => {
  const sentenceCount = countSentences(value)
  const meetsMinimum = sentenceCount >= minSentences

  return (
    <motion.section
      variants={fadeInUp}
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
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
        {title}
      </h2>

      {instructions && (
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
          {instructions}
        </p>
      )}

      {!readonly && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
          اكتب ما لا يقل عن {minSentences} جمل عربية
        </p>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readonly}
        placeholder={readonly ? '' : placeholder}
        rows={7}
        dir="rtl"
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${value && !meetsMinimum ? 'var(--warning)' : meetsMinimum && value ? 'var(--success)' : 'var(--border)'}`,
          background: readonly ? 'var(--bg-alt)' : 'var(--surface)',
          color: 'var(--ink)',
          fontSize: '1.05rem',
          lineHeight: 1.9,
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.15s',
          cursor: readonly ? 'default' : 'text',
          boxSizing: 'border-box',
        }}
      />

      {!readonly && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.375rem',
            fontSize: '0.8125rem',
          }}
        >
          <span style={{ color: meetsMinimum ? 'var(--success)' : 'var(--muted)' }}>
            {sentenceCount} / {minSentences} جمل
          </span>
          <span style={{ color: 'var(--muted-light)' }}>{value.length} حرف</span>
        </div>
      )}
    </motion.section>
  )
}
