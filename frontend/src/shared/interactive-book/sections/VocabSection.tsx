import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import type { VocabSection as VocabSectionType } from './types'

interface VocabSectionProps {
  section: VocabSectionType
  onWeakWord?: (word: string) => void
  onAudioPlay?: (key: string) => void
}

export const VocabSection: FC<VocabSectionProps> = ({ section, onWeakWord, onAudioPlay }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ marginBottom: '1rem' }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>المفردات</h2>
    <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
      {section.cards.map((card) => {
        const audioSrc = `/assets/audio/books/beginner/lesson-${section.lessonNumber}/vocab/${card.key}.mp3`
        return (
          <motion.div
            key={card.key}
            variants={listItem}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)', direction: 'rtl', margin: 0 }}>{card.arabic}</p>
              <button
                type="button"
                aria-label="إضافة لقائمة الكلمات الضعيفة"
                onClick={() => onWeakWord?.(card.arabic)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.125rem' }}
              >
                ⭐
              </button>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>{card.pronunciation}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', margin: 0 }}>{card.meaning}</p>
            {card.example && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0, direction: 'rtl' }}>{card.example}</p>
            )}
            <audio
              controls
              src={audioSrc}
              style={{ width: '100%', marginTop: '0.25rem', height: 32 }}
              onPlay={() => onAudioPlay?.(card.key)}
            />
          </motion.div>
        )
      })}
    </motion.div>
  </motion.section>
)
