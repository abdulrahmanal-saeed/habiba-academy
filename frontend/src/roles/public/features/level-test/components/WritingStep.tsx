import type { FC } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { stagger, fadeInUp } from '@/design-system/animations'
import { Button } from '@/design-system/components'

interface WritingStepProps {
  task1Prompt: string
  task2Prompt: string
  task1Value: string
  task2Value: string
  onChange1: (v: string) => void
  onChange2: (v: string) => void
  onNext: () => void
}

const MIN_WORDS = 30

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

const textareaStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--ink)',
  borderRadius: 'var(--radius)',
  resize: 'vertical' as const,
}

export const WritingStep: FC<WritingStepProps> = ({
  task1Prompt, task2Prompt,
  task1Value, task2Value,
  onChange1, onChange2,
  onNext,
}) => {
  const count1 = wordCount(task1Value)
  const count2 = wordCount(task2Value)
  const canContinue = count1 >= MIN_WORDS && count2 >= MIN_WORDS

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-8">
      <motion.div variants={fadeInUp} className="text-center">
        <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--ink)' }}>
          مهارة الكتابة
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          اكتب إجابتك باللغة العربية الفصحى قدر المستطاع
        </p>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-col gap-3">
        <div className="rounded-[var(--radius)] p-4" style={{ background: 'var(--accent-soft)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>
            المهمة الأولى
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            {task1Prompt}
          </p>
        </div>
        <textarea
          value={task1Value}
          onChange={(e) => onChange1(e.target.value)}
          rows={6}
          placeholder="اكتب إجابتك هنا..."
          dir="rtl"
          className="w-full p-4 text-sm leading-loose outline-none focus:ring-2"
          style={{ ...textareaStyle, focusRingColor: 'var(--accent)' } as React.CSSProperties}
        />
        <p className="text-end text-xs" style={{ color: count1 >= MIN_WORDS ? 'var(--success)' : 'var(--muted)' }}>
          {count1} كلمة {count1 < MIN_WORDS ? `(الحد الأدنى ${MIN_WORDS})` : '✓'}
        </p>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-col gap-3">
        <div className="rounded-[var(--radius)] p-4" style={{ background: 'var(--accent-soft)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>
            المهمة الثانية
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            {task2Prompt}
          </p>
        </div>
        <textarea
          value={task2Value}
          onChange={(e) => onChange2(e.target.value)}
          rows={9}
          placeholder="اكتب إجابتك هنا..."
          dir="rtl"
          className="w-full p-4 text-sm leading-loose outline-none focus:ring-2"
          style={textareaStyle}
        />
        <p className="text-end text-xs" style={{ color: count2 >= MIN_WORDS ? 'var(--success)' : 'var(--muted)' }}>
          {count2} كلمة {count2 < MIN_WORDS ? `(الحد الأدنى ${MIN_WORDS})` : '✓'}
        </p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canContinue}
          onClick={onNext}
          rightIcon={<ChevronLeft size={18} />}
        >
          التالي: المحادثة
        </Button>
      </motion.div>
    </motion.div>
  )
}
