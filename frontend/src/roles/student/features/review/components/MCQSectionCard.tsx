import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { MCQSection } from '../types'

export interface MCQSectionCardProps {
  section: MCQSection
  answers: Record<string, string>
  onAnswer: (qid: string, key: string) => void
}

export const MCQSectionCard: FC<MCQSectionCardProps> = ({ section, answers, onAnswer }) => {
  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'أسئلة الاختيار من متعدد'}
      </h2>
      {section.instructions && (
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {section.instructions}
        </p>
      )}

      {section.reading_text && (
        <div
          className="rounded-[var(--radius-md)] p-4 mb-4 text-sm leading-relaxed"
          style={{ background: 'var(--surface2)', whiteSpace: 'pre-wrap', color: 'var(--fg)' }}
        >
          {section.reading_text}
        </div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {section.questions.map((q, i) => {
          const chosen = answers[q.id] ?? ''
          return (
            <motion.div
              key={q.id}
              variants={cardVariant}
              className="rounded-[var(--radius-md)] p-4"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                {i + 1}. {q.question}
              </p>
              <div className="flex flex-col gap-2">
                {Object.entries(q.options).map(([key, label]) => {
                  const isChosen = chosen === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onAnswer(q.id, key)}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-start transition-colors"
                      style={{
                        border: `1px solid ${isChosen ? 'var(--accent)' : 'var(--border)'}`,
                        background: isChosen ? 'var(--accent-soft)' : 'transparent',
                        color: 'var(--fg)',
                      }}
                    >
                      <span
                        className="shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                        style={{
                          background: isChosen ? 'var(--accent)' : 'var(--border-soft)',
                          color: isChosen ? 'var(--bg)' : 'var(--muted)',
                        }}
                      >
                        {key}
                      </span>
                      {label}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
