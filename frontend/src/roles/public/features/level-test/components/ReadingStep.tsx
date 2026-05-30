import { useState } from 'react'
import type { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, BookOpen } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { Button, Spinner } from '@/design-system/components'
import { McqBlock } from './McqBlock'
import type { LevelTestBlock, McqAnswers } from '../types'

interface ReadingStepProps {
  blocks: LevelTestBlock[]
  isLoading: boolean
  answers: McqAnswers
  onAnswer: (id: number, ans: string) => void
  onNext: () => void
}

export const ReadingStep: FC<ReadingStepProps> = ({
  blocks, isLoading, answers, onAnswer, onNext,
}) => {
  const [blockIdx, setBlockIdx] = useState(0)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (blocks.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
        لا تتوفر أسئلة قراءة حالياً
      </div>
    )
  }

  const block = blocks[blockIdx]!
  const isLast = blockIdx === blocks.length - 1
  const blockAnswered = block.questions.every((q) => answers[q.id])

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
          قسم القراءة
        </h2>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {blockIdx + 1} / {blocks.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={blockIdx}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-5"
        >
          {block.passageAr && (
            <div
              className="rounded-[var(--radius-lg)] p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                <BookOpen size={16} />
                اقرأ النص التالي ثم أجب عن الأسئلة
              </div>
              <p
                className="text-sm leading-loose"
                style={{ color: 'var(--ink)', lineHeight: '2' }}
                dir="rtl"
              >
                {block.passageAr}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {block.questions.map((q) => (
              <McqBlock
                key={q.id}
                question={q}
                answer={answers[q.id]}
                onChange={onAnswer}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setBlockIdx((i) => i - 1)}
          disabled={blockIdx === 0}
          leftIcon={<ChevronRight size={18} />}
        >
          السابق
        </Button>

        {isLast ? (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!blockAnswered}
            rightIcon={<ChevronLeft size={18} />}
          >
            التالي: الكتابة
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => setBlockIdx((i) => i + 1)}
            disabled={!blockAnswered}
            rightIcon={<ChevronLeft size={18} />}
          >
            القسم التالي
          </Button>
        )}
      </div>

      {!blockAnswered && (
        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
          يرجى الإجابة على جميع أسئلة هذا القسم للمتابعة
        </p>
      )}
    </motion.div>
  )
}
