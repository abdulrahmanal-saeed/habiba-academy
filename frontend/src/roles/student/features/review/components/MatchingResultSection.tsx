import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { MatchingSection, AnswersMap, AutoBreakdownMap } from '../types'

export interface MatchingResultSectionProps {
  section: MatchingSection
  answers: AnswersMap
  autoBreakdown: AutoBreakdownMap
}

export const MatchingResultSection: FC<MatchingResultSectionProps> = ({
  section, answers, autoBreakdown,
}) => {
  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-3" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'أسئلة المطابقة'}
      </h2>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {section.exercises.map((exercise) => {
          const rightLabels = Object.fromEntries(
            exercise.right_column.map((r) => [r.id, r.label]),
          )
          const exBreakdown = autoBreakdown.matching?.[exercise.id]

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
              <div className="flex flex-col gap-2">
                {exercise.left_column.map((left) => {
                  const itemBreak  = exBreakdown?.items[left.id]
                  const givenId    = itemBreak?.given ?? answers.matching[exercise.id]?.[left.id] ?? ''
                  const correctId  = itemBreak?.correct ?? exercise.correct_pairs?.[left.id] ?? ''
                  const isCorrect  = Boolean(itemBreak?.is_correct)
                  const givenLabel  = rightLabels[givenId] ?? (givenId || '—')
                  const correctLabel = rightLabels[correctId] ?? correctId

                  return (
                    <div
                      key={left.id}
                      className="flex items-start gap-2 flex-wrap"
                    >
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: isCorrect ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                        {left.label}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        → إجابتك: <strong style={{ color: 'var(--fg)' }}>{givenLabel}</strong>
                      </span>
                      {!isCorrect && correctLabel && (
                        <span className="text-sm" style={{ color: 'var(--danger)' }}>
                          الصحيح: <strong>{correctLabel}</strong>
                        </span>
                      )}
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
