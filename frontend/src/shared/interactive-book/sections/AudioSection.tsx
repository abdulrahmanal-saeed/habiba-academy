import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { AudioSection as AudioSectionType } from './types'

interface AudioSectionProps {
  section: AudioSectionType
  onPlay?: (key: string) => void
}

export const AudioSection: FC<AudioSectionProps> = ({ section, onPlay }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>الاستماع</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {section.audioBlocks.map((block) => (
        <div key={block.key}>
          {block.title && (
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem', direction: 'rtl' }}>{block.title}</p>
          )}
          <audio
            controls
            src={block.file}
            style={{ width: '100%' }}
            onPlay={() => onPlay?.(block.key)}
          />
        </div>
      ))}
    </div>
  </motion.section>
)
