import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { TitleSection as TitleSectionType } from './types'

export const TitleSection: FC<{ section: TitleSectionType }> = ({ section }) => (
  <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
      {section.unitType === 'review' ? 'مراجعة' : 'درس'} {section.lessonNumber}
    </p>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem' }}>
      {section.lessonTitle}
    </h1>
    {section.description && (
      <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', maxWidth: 520, margin: '0 auto' }}>
        {section.description}
      </p>
    )}
  </motion.div>
)
