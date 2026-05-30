import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Pencil } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import { useHomeworkStore } from '../homework.store'
import type { WritingQuestion } from '../types'

export interface WritingStepProps {
  questions: WritingQuestion[]
  homeworkId: number
  studentId: number
}

export const WritingStep: FC<WritingStepProps> = ({ questions, homeworkId, studentId }) => {
  const writingAnswers  = useHomeworkStore((s) => s.writingAnswers)
  const setWritingAnswer = useHomeworkStore((s) => s.setWritingAnswer)
  const saveProgress     = useHomeworkStore((s) => s.saveProgress)

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Pencil size={20} color="var(--accent)" />
        <h2 className="font-bold text-base" style={{ color: 'var(--fg)' }}>
          قسم الكتابة
        </h2>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-5">
        {questions.map((q, idx) => {
          const qidStr  = String(q.id)
          const current = writingAnswers[qidStr] ?? ''

          return (
            <motion.div key={q.id} variants={listItem} className="flex flex-col gap-2">
              <label className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
                {idx + 1}. {q.prompt}
              </label>
              {q.focus && (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  التركيز: {q.focus}
                </p>
              )}
              {q.minSentences && (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  الحد الأدنى: {q.minSentences} جمل
                </p>
              )}
              <textarea
                rows={5}
                value={current}
                onChange={(e) => setWritingAnswer(qidStr, e.target.value)}
                onBlur={() => saveProgress(studentId, homeworkId)}
                placeholder="اكتبي إجابتك هنا..."
                className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  outline: 'none',
                  lineHeight: '1.8',
                }}
              />
              <p className="text-xs text-start" style={{ color: 'var(--muted)' }}>
                {current.trim() === '' ? 0 : current.trim().split(/\s+/).length} كلمة
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
