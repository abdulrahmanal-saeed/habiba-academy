import { motion } from 'framer-motion'
import type { FC } from 'react'
import { CheckSquare } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import { useHomeworkStore } from '../homework.store'
import type { MCQQuestion } from '../types'

export interface MCQStepProps {
  questions: MCQQuestion[]
  homeworkId: number
  studentId: number
}

const OPTS = ['A', 'B', 'C', 'D'] as const

function getOptText(q: MCQQuestion, opt: 'A' | 'B' | 'C' | 'D'): string | null {
  const map: Record<'A' | 'B' | 'C' | 'D', string | null> = {
    A: q.optA, B: q.optB, C: q.optC, D: q.optD,
  }
  return map[opt]
}

export const MCQStep: FC<MCQStepProps> = ({ questions, homeworkId, studentId }) => {
  const mcqAnswers  = useHomeworkStore((s) => s.mcqAnswers)
  const setMcqAnswer = useHomeworkStore((s) => s.setMcqAnswer)
  const saveProgress = useHomeworkStore((s) => s.saveProgress)

  const handleChange = (qid: string, answer: string) => {
    setMcqAnswer(qid, answer)
    saveProgress(studentId, homeworkId)
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-1">
        <CheckSquare size={20} color="var(--accent)" />
        <h2 className="font-bold text-base" style={{ color: 'var(--fg)' }}>
          أسئلة الاختيار من متعدد
        </h2>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {questions.map((q, idx) => {
          const qidStr = String(q.id)
          const selected = mcqAnswers[qidStr]

          return (
            <motion.div
              key={q.id}
              variants={listItem}
              className="rounded-xl p-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <p className="font-semibold text-sm mb-3" style={{ color: 'var(--fg)' }}>
                {idx + 1}. {q.questionText}
              </p>
              <div className="flex flex-col gap-2">
                {OPTS.map((opt) => {
                  const text = getOptText(q, opt)
                  if (!text) return null
                  const isSelected = selected === opt
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer text-sm"
                      style={{
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--accent-soft)' : 'transparent',
                        color: 'var(--fg)',
                      }}
                    >
                      <input
                        type="radio"
                        name={`mcq-${q.id}`}
                        value={opt}
                        checked={isSelected}
                        onChange={() => handleChange(qidStr, opt)}
                        className="sr-only"
                      />
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                        style={{
                          borderColor: isSelected ? 'var(--accent)' : 'var(--muted)',
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          color: isSelected ? 'var(--on-accent)' : 'var(--muted)',
                        }}
                      >
                        {opt}
                      </span>
                      {text}
                    </label>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
