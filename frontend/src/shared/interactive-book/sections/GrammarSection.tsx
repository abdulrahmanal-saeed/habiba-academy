import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { GrammarSection as GrammarSectionType } from './types'

export const GrammarSection: FC<{ section: GrammarSectionType }> = ({ section }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>القاعدة النحوية</h2>
    {section.tips.map((tip, i) => (
      <div key={i} style={{ marginBottom: i < section.tips.length - 1 ? '1rem' : 0 }}>
        {tip.title && <p style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem', direction: 'rtl' }}>{tip.title}</p>}
        {tip.body && <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.7, direction: 'rtl', marginBottom: '0.5rem' }}>{tip.body}</p>}
        {tip.examples?.map((ex, j) => (
          <div key={j} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', direction: 'rtl', margin: 0 }}>{ex.ar}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>{ex.en}</p>
          </div>
        ))}
      </div>
    ))}
  </motion.section>
)
