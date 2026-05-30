import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import { Button } from '@/design-system/components'
import type { Homework } from '../types'

export interface SubmitStepProps {
  homework: Homework
  mcqAnswers: Record<string, string>
  writingAnswers: Record<string, string>
  speakingBlobs: Record<string, Blob>
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
}

interface SummaryRow {
  emoji: string
  label: string
  done: number
  total: number
}

function rowColor(done: number, total: number): string {
  if (total === 0) return 'var(--muted)'
  if (done === total) return 'var(--success)'
  if (done > 0) return 'var(--warning)'
  return 'var(--danger)'
}

export const SubmitStep: FC<SubmitStepProps> = ({
  homework,
  mcqAnswers,
  writingAnswers,
  speakingBlobs,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const mcqDone  = Object.keys(mcqAnswers).length
  const wrDone   = Object.values(writingAnswers).filter((t) => t.trim().length > 0).length
  const spDone   = Object.keys(speakingBlobs).length

  const rows: SummaryRow[] = [
    ...(homework.mcqQuestions.length > 0
      ? [{ emoji: '❓', label: 'اختيار من متعدد', done: mcqDone, total: homework.mcqQuestions.length }]
      : []),
    ...(homework.writingQuestions.length > 0
      ? [{ emoji: '✍️', label: 'كتابة', done: wrDone, total: homework.writingQuestions.length }]
      : []),
    ...(homework.speakingQuestions.length > 0
      ? [{ emoji: '🎤', label: 'تحدث', done: spDone, total: homework.speakingQuestions.length }]
      : []),
  ]

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-6 flex flex-col items-center gap-5 text-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-4xl">📋</span>
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>مراجعة وتسليم</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          تحققي من إجاباتك قبل التسليم
        </p>
      </div>

      {rows.length > 0 && (
        <div className="w-full flex flex-col gap-2 text-start">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm"
              style={{ background: 'var(--surface2)' }}
            >
              <span>{row.emoji}</span>
              <span className="flex-1" style={{ color: 'var(--fg)' }}>{row.label}</span>
              <span className="font-bold" style={{ color: rowColor(row.done, row.total) }}>
                {row.done === row.total ? '✅' : row.done > 0 ? '⚠️' : '❌'} {row.done} / {row.total}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className="px-10">
        {isSubmitting ? 'جارٍ التسليم…' : 'تسليم الواجب'}
      </Button>
    </motion.div>
  )
}
