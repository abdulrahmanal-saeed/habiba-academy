import type { FC } from 'react'
import { motion } from 'framer-motion'
import { stagger } from '@/design-system/animations'
import type { BlockQuestion } from '../types'

interface McqBlockProps {
  question: BlockQuestion
  answer: string | undefined
  onChange: (id: number, answer: string) => void
}

export const McqBlock: FC<McqBlockProps> = ({ question, answer, onChange }) => {
  const options = [
    { key: 'A', text: question.optA },
    { key: 'B', text: question.optB },
    { key: 'C', text: question.optC },
    ...(question.optD ? [{ key: 'D', text: question.optD }] : []),
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
      <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--ink)' }}>
        <span className="me-2 font-bold" style={{ color: 'var(--accent)' }}>
          {question.itemNumber}.
        </span>
        {question.questionAr}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = answer === opt.key
          return (
            <motion.button
              key={opt.key}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(question.id, opt.key)}
              className="flex w-full items-center gap-3 rounded-[var(--radius)] px-4 py-2.5 text-start text-sm transition-colors"
              style={{
                background: selected ? 'var(--accent-soft)' : 'var(--surface)',
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-soft)'}`,
                color: selected ? 'var(--accent)' : 'var(--ink-soft)',
              }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: selected ? 'var(--accent)' : 'var(--border)',
                  color: selected ? 'white' : 'var(--ink)',
                }}
              >
                {opt.key}
              </span>
              {opt.text}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
