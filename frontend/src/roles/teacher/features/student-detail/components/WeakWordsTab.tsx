import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import { getWeakWords } from '../api'

interface WeakWordsTabProps {
  studentId: number
}

export const WeakWordsTab: FC<WeakWordsTabProps> = ({ studentId }) => {
  const { data: words = [], isLoading } = useQuery({
    queryKey: ['student-weak-words', studentId],
    queryFn: () => getWeakWords(studentId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <motion.p
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="text-sm text-center py-10"
        style={{ color: 'var(--muted)' }}
      >
        No weak words tracked yet
      </motion.p>
    )
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {words.map((w) => (
        <motion.div
          key={w.id}
          variants={listItem}
          className="rounded-2xl px-4 py-3"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${w.is_mastered ? 'var(--success)' : 'var(--border)'}`,
            opacity: w.is_mastered ? 0.7 : 1,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{w.word}</div>
              {w.note && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{w.note}</div>
              )}
              {w.guidance && (
                <div className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted)' }}>{w.guidance}</div>
              )}
            </div>
            {!!w.is_mastered && (
              <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
