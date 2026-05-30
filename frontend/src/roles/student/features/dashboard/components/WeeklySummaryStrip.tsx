import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { WeeklySummary } from '../types'

export interface WeeklySummaryStripProps {
  data: WeeklySummary
}

interface Stat {
  label: string
  value: string
}

export const WeeklySummaryStrip: FC<WeeklySummaryStripProps> = ({ data }) => {
  // Hidden when hw_done=0 AND sc_done=0 (PHP rule)
  if (data.hwDone === 0 && data.scDone === 0) return null

  const stats: Stat[] = [
    { label: 'واجبات منجزة', value: `${data.hwDone} / ${data.hwTotal}` },
    { label: 'محادثات',      value: `${data.scDone} / ${data.scTotal}` },
    { label: 'مراجعات',      value: String(data.reviewsDone) },
    { label: 'كلمات مكتسبة', value: String(data.wordsLearned) },
  ]

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-4 grid grid-cols-4 gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {stat.value}
          </p>
          <p className="text-xs leading-tight" style={{ color: 'var(--muted)' }}>
            {stat.label}
          </p>
        </div>
      ))}
    </motion.div>
  )
}
