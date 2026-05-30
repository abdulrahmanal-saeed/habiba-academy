import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { MCQSection, AnswersMap, AutoBreakdownMap, ManualScoreEntry } from '../types'

export interface MCQResultSectionProps {
  section: MCQSection
  answers: AnswersMap
  autoBreakdown: AutoBreakdownMap
  manualScores: Record<string, ManualScoreEntry>
  sectionOverrides: Record<string, 'auto' | 'manual'>
}

function resolveItem(
  sectionId: string,
  qid: string,
  breakdown: AutoBreakdownMap,
  manualScores: Record<string, ManualScoreEntry>,
  sectionMode: 'auto' | 'manual',
): { isCorrect: boolean; earned: number; points: number } {
  const b       = breakdown.mcq?.[qid]
  const fallback = { isCorrect: Boolean(b?.is_correct), earned: b?.earned ?? 0, points: b?.points ?? 0 }
  if (sectionMode !== 'manual') return fallback
  const saved = manualScores[`${sectionId}::${qid}`]
  if (!saved) return fallback
  const verdict = saved.teacher_verdict
  const isCorrect = verdict === 'correct' ? true : verdict === 'wrong' ? false : fallback.isCorrect
  const earned    = verdict === 'correct' ? saved.max_points : verdict === 'wrong' ? 0 : saved.score
  return { isCorrect, earned, points: saved.max_points }
}

export const MCQResultSection: FC<MCQResultSectionProps> = ({
  section, answers, autoBreakdown, manualScores, sectionOverrides,
}) => {
  const mode = (sectionOverrides[section.section_id] ?? (section.auto_gradable ? 'auto' : 'manual')) as 'auto' | 'manual'

  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-3" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'أسئلة الاختيار من متعدد'}
      </h2>

      {section.reading_text && (
        <div
          className="rounded-[var(--radius-md)] p-4 mb-4 text-sm leading-relaxed"
          style={{ background: 'var(--surface2)', whiteSpace: 'pre-wrap', color: 'var(--fg)' }}
        >
          {section.reading_text}
        </div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
        {section.questions.map((q, i) => {
          const { isCorrect, earned, points } = resolveItem('mcq', q.id, autoBreakdown, manualScores, mode)
          const givenKey   = autoBreakdown.mcq?.[q.id]?.given ?? answers.mcq[q.id] ?? ''
          const correctKey = autoBreakdown.mcq?.[q.id]?.correct ?? q.correct ?? ''
          const givenLabel  = q.options[givenKey] ?? ''
          const correctLabel = q.options[correctKey] ?? ''

          return (
            <motion.div
              key={q.id}
              variants={cardVariant}
              className="rounded-[var(--radius-md)] p-4"
              style={{
                border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                background: 'var(--bg)',
              }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                {i + 1}. {q.question}
              </p>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: isCorrect ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {isCorrect ? 'صحيح' : 'خطأ'}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {earned}/{points} نقطة
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                إجابتك:{' '}
                <strong style={{ color: 'var(--fg)' }}>
                  {givenKey ? `${givenKey}. ${givenLabel}` : '—'}
                </strong>
              </p>
              {!isCorrect && correctKey && (
                <p className="text-sm mt-1" style={{ color: 'var(--danger)' }}>
                  الإجابة الصحيحة:{' '}
                  <strong>{correctKey}. {correctLabel}</strong>
                </p>
              )}
              {q.hint && (
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                  {q.hint}
                </p>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
