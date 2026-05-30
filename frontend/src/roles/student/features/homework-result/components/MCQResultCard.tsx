import { motion } from 'framer-motion'
import type { FC } from 'react'
import { CheckSquare } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import type { MCQOption, MCQOptionState, MCQResult } from '../types'

export interface MCQResultCardProps {
  results: MCQResult[]
  score: number
  total: number
}

const OPTS: MCQOption[] = ['a', 'b', 'c', 'd']

function optText(q: MCQResult, opt: MCQOption): string | null {
  return { a: q.optA, b: q.optB, c: q.optC, d: q.optD }[opt]
}

function getState(opt: MCQOption, chosen: MCQOption | null, correct: MCQOption): MCQOptionState {
  const isChosen  = chosen === opt
  const isCorrect = correct === opt
  if (isChosen && isCorrect)  return 'correct-chosen'
  if (!isChosen && isCorrect) return 'correct-unchosen'
  if (isChosen && !isCorrect) return 'wrong-chosen'
  return 'neutral'
}

interface OptStyle { bg: string; border: string; textColor: string; icon: string }

const STYLE: Record<MCQOptionState, OptStyle> = {
  'correct-chosen':   { bg: 'var(--success-bg)', border: 'var(--success)', textColor: 'var(--success)', icon: '✓' },
  'correct-unchosen': { bg: 'var(--success-bg)', border: 'var(--success)', textColor: 'var(--success)', icon: '✓' },
  'wrong-chosen':     { bg: 'var(--danger-bg)',  border: 'var(--danger)',  textColor: 'var(--danger)',  icon: '✗' },
  'neutral':          { bg: 'transparent',       border: 'var(--border)', textColor: 'var(--muted)',   icon: ''  },
}

const MCQQuestion: FC<{ q: MCQResult; idx: number }> = ({ q, idx }) => (
  <motion.div
    variants={listItem}
    className="rounded-xl p-4"
    style={{
      border: `1px solid ${q.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
      background: q.isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
    }}
  >
    {/* Question header */}
    <div className="flex items-start justify-between gap-2 mb-3">
      <p className="font-semibold text-sm flex-1" style={{ color: 'var(--fg)' }}>
        {idx + 1}. {q.questionText}
      </p>
      <span
        className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{
          background: q.isCorrect ? 'var(--success)' : 'var(--danger)',
          color: 'var(--on-accent)',
        }}
      >
        {q.isCorrect ? '✓ صحيح' : '✗ خطأ'}
      </span>
    </div>

    {/* Options */}
    <div className="flex flex-col gap-1.5">
      {OPTS.map((opt) => {
        const text = optText(q, opt)
        if (!text) return null
        const state = getState(opt, q.chosenOption, q.correctOption)
        const s = STYLE[state]

        return (
          <div
            key={opt}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <span
              className="flex-shrink-0 w-4 text-xs font-bold text-center"
              style={{ color: s.icon ? s.textColor : 'var(--muted)' }}
            >
              {s.icon || opt.toUpperCase()}
            </span>
            <span
              className="flex-1"
              style={{
                color: 'var(--fg)',
                fontWeight: state === 'correct-chosen' || state === 'wrong-chosen' ? '600' : '400',
              }}
            >
              {text}
            </span>
            {state === 'correct-chosen' && (
              <span className="text-xs font-semibold ms-auto" style={{ color: 'var(--success)' }}>
                إجابتك ✓
              </span>
            )}
            {state === 'wrong-chosen' && (
              <span className="text-xs font-semibold ms-auto" style={{ color: 'var(--danger)' }}>
                إجابتك ✗
              </span>
            )}
            {state === 'correct-unchosen' && (
              <span className="text-xs font-semibold ms-auto" style={{ color: 'var(--success)' }}>
                ← الإجابة الصحيحة
              </span>
            )}
          </div>
        )
      })}
    </div>
  </motion.div>
)

export const MCQResultCard: FC<MCQResultCardProps> = ({ results, score, total }) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-center gap-2">
      <CheckSquare size={18} color="var(--accent)" />
      <h3 className="font-bold text-base flex-1" style={{ color: 'var(--fg)' }}>
        الاختيار من متعدد
      </h3>
      {total > 0 && (
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {score} / {total}
        </span>
      )}
    </div>

    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
      {results.map((q, idx) => (
        <MCQQuestion key={q.id} q={q} idx={idx} />
      ))}
    </motion.div>
  </div>
)
