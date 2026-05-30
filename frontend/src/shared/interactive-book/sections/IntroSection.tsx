import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { IntroSection as IntroSectionType } from './types'

export const IntroSection: FC<{ section: IntroSectionType }> = ({ section }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ marginBottom: '1rem' }}>
    <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: section.situationText ? '0.75rem' : 0 }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem' }}>الهدف</p>
      <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.7, direction: 'rtl' }}>{section.goalText}</p>
    </div>
    {section.situationText && (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.25rem' }}>الموقف</p>
        <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.7, direction: 'rtl' }}>{section.situationText}</p>
      </div>
    )}
  </motion.section>
)
