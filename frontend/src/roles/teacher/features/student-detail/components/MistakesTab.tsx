import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import { getMistakes } from '../api'

interface MistakesTabProps {
  studentId: number
}

export const MistakesTab: FC<MistakesTabProps> = ({ studentId }) => {
  const { data: mistakes = [], isLoading } = useQuery({
    queryKey: ['student-mistakes', studentId],
    queryFn: () => getMistakes(studentId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (mistakes.length === 0) {
    return (
      <motion.p
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="text-sm text-center py-10"
        style={{ color: 'var(--muted)' }}
      >
        No mistakes tracked yet
      </motion.p>
    )
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-2"
    >
      {mistakes.map((m) => (
        <motion.div
          key={m.id}
          variants={listItem}
          className="rounded-2xl px-3 py-2"
          style={{
            background: 'var(--surface)',
            border: `1px solid ${m.is_mastered ? 'var(--success)' : 'var(--border)'}`,
            opacity: m.is_mastered ? 0.7 : 1,
          }}
          title={m.guidance}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{m.mistake_tag}</span>
            {!!m.is_mastered && <CheckCircle size={12} style={{ color: 'var(--success)' }} />}
          </div>
          {m.note && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{m.note}</div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
