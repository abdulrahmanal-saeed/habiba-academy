import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { CompleteSection as CompleteSectionType } from './types'

interface CompleteSectionProps {
  section: CompleteSectionType
  answers: Record<string, string>
  onChange: (itemId: string, value: string) => void
  readonly?: boolean
}

export const CompleteSection: FC<CompleteSectionProps> = ({ section, answers, onChange, readonly }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{section.title}</h2>
    {section.hint && <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>{section.hint}</p>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {section.items.map((item) => (
        <div key={item.id}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', direction: 'rtl', marginBottom: '0.375rem' }}>{item.prompt}</p>
          <input
            type="text"
            disabled={readonly}
            value={answers[item.id] ?? ''}
            onChange={(e) => onChange(item.id, e.target.value)}
            dir="rtl"
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9375rem', background: readonly ? 'var(--bg)' : 'var(--card)', color: 'var(--ink)', boxSizing: 'border-box' }}
          />
        </div>
      ))}
    </div>
  </motion.section>
)
