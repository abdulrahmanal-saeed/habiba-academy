import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { OrderSection as OrderSectionType } from './types'

interface OrderSectionProps {
  section: OrderSectionType
  answers: Record<string, string>
  onChange: (itemId: string, value: string) => void
  readonly?: boolean
}

export const OrderSection: FC<OrderSectionProps> = ({ section, answers, onChange, readonly }) => {
  const total = section.items.length
  const options = Array.from({ length: total }, (_, i) => String(i + 1))

  return (
    <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{section.title}</h2>
      {section.hint && <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>{section.hint}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {section.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              disabled={readonly}
              value={answers[item.id] ?? ''}
              onChange={(e) => onChange(item.id, e.target.value)}
              style={{ width: 56, padding: '0.375rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)', color: 'var(--ink)', cursor: readonly ? 'not-allowed' : 'pointer' }}
            >
              <option value="">—</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', direction: 'rtl', margin: 0, flex: 1 }}>{item.sentence}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
