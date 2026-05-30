import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { FillTheBlankSection } from '../types'

export interface FillBlankSectionCardProps {
  section: FillTheBlankSection
  answers: Record<string, string>
  onAnswer: (qid: string, text: string) => void
}

function getPrompt(q: FillTheBlankSection['questions'][number]): string {
  return q.sentence_with_blank ?? q.prompt ?? q.question ?? ''
}

export const FillBlankSectionCard: FC<FillBlankSectionCardProps> = ({ section, answers, onAnswer }) => {
  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'أكمل الفراغ'}
      </h2>
      {section.instructions && (
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {section.instructions}
        </p>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {section.questions.map((q, i) => {
          const prompt  = getPrompt(q)
          const hasImg  = Boolean(q.image_hint_url)
          return (
            <motion.div
              key={q.id}
              variants={cardVariant}
              className="rounded-[var(--radius-md)] p-4"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              <div className={hasImg ? 'grid grid-cols-[auto_1fr] gap-3 items-start' : ''}>
                {hasImg && (
                  <img
                    src={q.image_hint_url}
                    alt={q.image_hint_alt ?? 'تلميح'}
                    className="w-20 h-20 rounded-[var(--radius-sm)] object-cover"
                  />
                )}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`fill-${q.id}`}
                    className="text-sm font-semibold"
                    style={{ color: 'var(--fg)' }}
                  >
                    {i + 1}. {prompt}
                  </label>
                  {q.english_hint && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {q.english_hint}
                    </p>
                  )}
                  <input
                    id={`fill-${q.id}`}
                    type="text"
                    dir="auto"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => onAnswer(q.id, e.target.value)}
                    placeholder="أكتب إجابتك هنا"
                    className="rounded-[var(--radius-sm)] px-3 py-2 text-sm outline-none"
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--fg)',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
