import type { FC } from 'react'
import { motion } from 'framer-motion'
import { stagger, listItem } from '@/design-system/animations'
import type { StudentDetail } from '../types'

interface StatBarProps {
  student: StudentDetail
}

export const StatBar: FC<StatBarProps> = ({ student }) => {
  const stats = [
    { label: 'Submitted', value: String(student.submitted_count) },
    {
      label: 'Avg Score',
      value: student.submitted_count > 0 ? `${student.avg_score}%` : '—',
    },
    { label: 'Recordings', value: String(student.recordings_count) },
    { label: 'Level', value: student.level || 'A2' },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-4 gap-3"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={listItem}
          className="rounded-xl px-3 py-3 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
            {s.value}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {s.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
