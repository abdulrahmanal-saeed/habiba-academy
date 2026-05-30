import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { ImageSection as ImageSectionType } from './types'

export const ImageSection: FC<{ section: ImageSectionType }> = ({ section }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ marginBottom: '1rem', textAlign: 'center' }}>
    <img
      src={section.imageUrl}
      alt={section.caption ?? ''}
      style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
    />
    {section.caption && (
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.5rem' }}>{section.caption}</p>
    )}
  </motion.section>
)
