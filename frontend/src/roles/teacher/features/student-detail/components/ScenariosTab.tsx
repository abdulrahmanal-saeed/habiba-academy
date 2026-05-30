import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import { getConversations } from '../api'

interface ScenariosTabProps {
  studentId: number
}

export const ScenariosTab: FC<ScenariosTabProps> = ({ studentId }) => {
  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['student-conversations', studentId],
    queryFn: () => getConversations(studentId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (recordings.length === 0) {
    return (
      <motion.p
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="text-sm text-center py-10"
        style={{ color: 'var(--muted)' }}
      >
        No recordings yet
      </motion.p>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
      {recordings.map((r) => (
        <motion.div
          key={r.id}
          variants={listItem}
          className="rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2 mb-2">
            <Mic size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
            <div className="min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{r.title}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                {r.sc_date} · Take {r.take_number}
                {r.submitted_at && ` · ${r.submitted_at}`}
              </div>
            </div>
          </div>

          {r.audio_src && (
            <audio
              controls
              src={r.audio_src}
              className="w-full mt-2"
              style={{ height: 32 }}
            />
          )}

          {r.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {r.chips.map((chip, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {r.teacher_note && (
            <p className="text-xs mt-2 italic" style={{ color: 'var(--muted)' }}>{r.teacher_note}</p>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
