import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Pencil } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import type { WritingResult } from '../types'

export interface WritingResultCardProps {
  results: WritingResult[]
}

export const WritingResultCard: FC<WritingResultCardProps> = ({ results }) => (
  <motion.div
    variants={stagger}
    initial="hidden"
    animate="visible"
    className="rounded-2xl p-5 flex flex-col gap-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-center gap-2">
      <Pencil size={18} color="var(--accent)" />
      <h3 className="font-bold text-base" style={{ color: 'var(--fg)' }}>
        قسم الكتابة
      </h3>
    </div>

    {results.map((wr, idx) => (
      <motion.div key={wr.id} variants={listItem} className="flex flex-col gap-2">
        <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
          {idx + 1}. {wr.prompt}
        </p>
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'var(--surface2)',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.85',
            color: wr.answerText ? 'var(--fg)' : 'var(--muted)',
          }}
        >
          {wr.answerText ?? 'لا توجد إجابة'}
        </div>
      </motion.div>
    ))}
  </motion.div>
)
