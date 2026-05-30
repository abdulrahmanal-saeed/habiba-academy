import { motion } from 'framer-motion'
import type { FC } from 'react'
import { BookOpen } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'

export interface ReadingStepProps {
  text: string
}

export const ReadingStep: FC<ReadingStepProps> = ({ text }) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    animate="visible"
    className="rounded-2xl p-5 flex flex-col gap-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-center gap-2">
      <BookOpen size={20} color="var(--accent)" />
      <h2 className="font-bold text-base" style={{ color: 'var(--fg)' }}>
        قسم القراءة
      </h2>
    </div>

    <div
      className="rounded-xl p-4 text-sm leading-loose"
      style={{
        background: 'var(--surface2)',
        color: 'var(--fg)',
        whiteSpace: 'pre-wrap',
        lineHeight: '2',
      }}
    >
      {text}
    </div>
  </motion.div>
)
