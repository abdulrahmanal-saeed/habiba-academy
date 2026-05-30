import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { WritingSection } from '../types'

export interface WritingSectionCardProps {
  section: WritingSection
  answers: Record<string, string>
  onAnswer: (qid: string, text: string) => void
}

export const WritingSectionCard: FC<WritingSectionCardProps> = ({ section, answers, onAnswer }) => {
  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'التعبير الكتابي'}
      </h2>
      {section.instructions && (
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {section.instructions}
        </p>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {section.questions.map((q, i) => (
          <motion.div key={q.id} variants={cardVariant} className="flex flex-col gap-2">
            <label
              htmlFor={`writing-${q.id}`}
              className="text-sm font-semibold"
              style={{ color: 'var(--fg)' }}
            >
              {i + 1}. {q.prompt}
            </label>
            <textarea
              id={`writing-${q.id}`}
              dir="auto"
              rows={5}
              value={answers[q.id] ?? ''}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              placeholder="أكتب إجابتك هنا..."
              className="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm resize-y outline-none"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                minHeight: '120px',
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
