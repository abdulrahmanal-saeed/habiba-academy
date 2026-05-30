import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { PassageSection as PassageSectionType } from './types'

export const PassageSection: FC<{ section: PassageSectionType }> = ({ section }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>النصوص</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {section.sentences.map((s, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < section.sentences.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', direction: 'rtl', textAlign: 'right', margin: 0 }}>{s.ar}</p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', margin: 0 }}>{s.en}</p>
        </div>
      ))}
    </div>
  </motion.section>
)
