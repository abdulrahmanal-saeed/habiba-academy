import type { FC } from 'react'
import { motion } from 'framer-motion'
import { stagger, fadeInUp } from '@/design-system/animations'
import { Button } from '@/design-system/components'
import { AudioRecorder } from './AudioRecorder'
import type { SpeakingPrompt, SpeakingKey } from '../types'

interface SpeakingStepProps {
  prompts: SpeakingPrompt[]
  recordings: Partial<Record<SpeakingKey, Blob>>
  onRecord: (key: SpeakingKey, blob: Blob) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const KEYS: SpeakingKey[] = ['speaking_1', 'speaking_2', 'speaking_3', 'speaking_4']

export const SpeakingStep: FC<SpeakingStepProps> = ({
  prompts, recordings, onRecord, onSubmit, isSubmitting,
}) => {
  const allRecorded = KEYS.every((k) => recordings[k])

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
      <motion.div variants={fadeInUp} className="text-center">
        <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--ink)' }}>
          مهارة المحادثة
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          سجّل إجابتك الصوتية لكل سؤال. يمكنك إعادة التسجيل في أي وقت.
        </p>
      </motion.div>

      {prompts.map((prompt) => {
        const key = `speaking_${prompt.number}` as SpeakingKey
        return (
          <motion.div
            key={prompt.number}
            variants={fadeInUp}
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] p-5"
            style={{ background: 'var(--card)', border: '1px solid var(--border-soft)' }}
          >
            <div>
              <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {prompt.number}. {prompt.title}
              </p>
              {prompt.imageUrl && (
                <img
                  src={prompt.imageUrl}
                  alt=""
                  className="mb-3 w-full max-w-xs rounded-[var(--radius)] object-cover"
                />
              )}
              {prompt.bullets.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {prompt.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--accent)' }}>•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <AudioRecorder
              label={`تسجيل السؤال ${prompt.number}`}
              isDone={!!recordings[key]}
              onRecorded={(blob) => onRecord(key, blob)}
            />
          </motion.div>
        )
      })}

      <motion.div variants={fadeInUp} className="flex flex-col items-center gap-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!allRecorded}
          isLoading={isSubmitting}
          onClick={onSubmit}
        >
          إرسال الاختبار
        </Button>
        {!allRecorded && (
          <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
            يرجى إكمال جميع التسجيلات الأربعة للإرسال
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
