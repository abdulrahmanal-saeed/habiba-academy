import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { MatchingSection } from '../types'

export interface MatchingSectionCardProps {
  section: MatchingSection
  answers: Record<string, Record<string, string>>
  onAnswer: (exId: string, leftId: string, rightId: string) => void
}

export const MatchingSectionCard: FC<MatchingSectionCardProps> = ({ section, answers, onAnswer }) => {
  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'أسئلة المطابقة'}
      </h2>
      {section.instructions && (
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {section.instructions}
        </p>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {section.exercises.map((exercise) => {
          const exAnswers = answers[exercise.id] ?? {}
          return (
            <motion.div
              key={exercise.id}
              variants={cardVariant}
              className="rounded-[var(--radius-md)] p-4"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              {exercise.title && (
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  {exercise.title}
                </p>
              )}
              <div className="flex flex-col gap-2.5">
                {exercise.left_column.map((left) => {
                  const chosen = exAnswers[left.id] ?? ''
                  return (
                    <div key={left.id} className="grid grid-cols-2 gap-2 items-center">
                      <span
                        className="text-sm font-medium px-3 py-2 rounded-[var(--radius-sm)]"
                        style={{ background: 'var(--surface2)', color: 'var(--fg)' }}
                      >
                        {left.label}
                      </span>
                      <select
                        value={chosen}
                        onChange={(e) => onAnswer(exercise.id, left.id, e.target.value)}
                        className="text-sm rounded-[var(--radius-sm)] px-3 py-2 outline-none"
                        style={{
                          border: `1px solid ${chosen ? 'var(--accent)' : 'var(--border)'}`,
                          background: chosen ? 'var(--accent-soft)' : 'var(--bg)',
                          color: 'var(--fg)',
                        }}
                      >
                        <option value="">اختر</option>
                        {exercise.right_column.map((right) => (
                          <option key={right.id} value={right.id}>
                            {right.label}
                          </option>
                        ))}
                      </select>
                    </div>
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
