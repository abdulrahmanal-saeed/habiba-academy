import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { DialogueSection as DialogueSectionType } from './types'

export const DialogueSection: FC<{ section: DialogueSectionType }> = ({ section }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>المحادثة</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {section.chunks.map((chunk, i) => (
        <div key={i} style={{ borderInlineStart: '3px solid var(--accent)', paddingInlineStart: '0.75rem' }}>
          {chunk.title && (
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem' }}>{chunk.title}</p>
          )}
          {chunk.arabic.map((line, j) => (
            <p key={j} style={{ fontSize: '0.9375rem', color: 'var(--ink)', direction: 'rtl', margin: '0 0 0.125rem' }}>{line}</p>
          ))}
          {chunk.note && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>{chunk.note}</p>
          )}
        </div>
      ))}
    </div>
  </motion.section>
)
