import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { FillTheBlankSection, AnswersMap, AutoBreakdownMap, ManualScoreEntry } from '../types'

export interface FillBlankResultSectionProps {
  section: FillTheBlankSection
  answers: AnswersMap
  autoBreakdown: AutoBreakdownMap
  manualScores: Record<string, ManualScoreEntry>
  sectionOverrides: Record<string, 'auto' | 'manual'>
}

function fillSentence(template: string | undefined, answer: string): string {
  if (!template) return answer
  if (template.includes('_____')) return template.replace('_____', answer || '_____')
  return `${template} ${answer}`.trim()
}

function resolveItem(
  qid: string,
  breakdown: AutoBreakdownMap,
  manualScores: Record<string, ManualScoreEntry>,
  sectionMode: 'auto' | 'manual',
): { isCorrect: boolean; earned: number; points: number; feedback: string | null } {
  const b       = breakdown.fill_the_blank?.[qid]
  const fallback = { isCorrect: Boolean(b?.is_correct), earned: b?.earned ?? 0, points: b?.points ?? 0, feedback: null }
  if (sectionMode !== 'manual') return fallback
  const saved = manualScores[`fill_the_blank::${qid}`]
  if (!saved) return fallback
  const verdict   = saved.teacher_verdict
  const isCorrect = verdict === 'correct' ? true : verdict === 'wrong' ? false : fallback.isCorrect
  const earned    = verdict === 'correct' ? saved.max_points : verdict === 'wrong' ? 0 : saved.score
  return { isCorrect, earned, points: saved.max_points, feedback: saved.feedback }
}

export const FillBlankResultSection: FC<FillBlankResultSectionProps> = ({
  section, answers, autoBreakdown, manualScores, sectionOverrides,
}) => {
  const mode = (sectionOverrides[section.section_id] ?? 'auto') as 'auto' | 'manual'

  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-3" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'أكمل الفراغ'}
      </h2>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
        {section.questions.map((q, i) => {
          const template   = q.sentence_with_blank ?? q.prompt ?? q.question ?? ''
          const given      = autoBreakdown.fill_the_blank?.[q.id]?.given ?? answers.fill_the_blank[q.id] ?? ''
          const correctArr = autoBreakdown.fill_the_blank?.[q.id]?.correct_answers ?? q.correct_answers ?? []
          const { isCorrect, earned, points, feedback } = resolveItem(q.id, autoBreakdown, manualScores, mode)

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
                {i + 1}. {template}
              </p>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                إجابتك: <strong style={{ color: 'var(--fg)' }}>{given || '—'}</strong>
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                جملتك: <strong style={{ color: 'var(--fg)' }}>{fillSentence(template, given)}</strong>
              </p>
              {!isCorrect && correctArr.length > 0 && (
                <>
                  <p className="text-sm mt-1" style={{ color: 'var(--danger)' }}>
                    الإجابة الصحيحة: <strong>{correctArr.join(' / ')}</strong>
                  </p>
                  <p className="text-sm" style={{ color: 'var(--danger)' }}>
                    الجملة الصحيحة: <strong>{fillSentence(template, correctArr[0] ?? '')}</strong>
                  </p>
                </>
              )}
              {feedback && (
                <div
                  className="mt-2 rounded-[var(--radius-sm)] p-2 text-sm"
                  style={{ background: 'var(--accent-soft)', color: 'var(--fg)' }}
                >
                  {feedback}
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
