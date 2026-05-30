import { motion } from 'framer-motion'
import type { FC } from 'react'
import { CheckCircle, Clock, MessageSquare } from 'lucide-react'
import { cardVariant } from '@/design-system/animations'

export interface ResultHeaderProps {
  isSubmitted: boolean
  submittedAt: string | null
  mcqScore: number
  mcqTotal: number
  teacherNote: string | null
}

export const ResultHeader: FC<ResultHeaderProps> = ({
  isSubmitted,
  submittedAt,
  mcqScore,
  mcqTotal,
  teacherNote,
}) => {
  const showScore = isSubmitted && mcqTotal > 0
  const pct = showScore ? Math.round((mcqScore / mcqTotal) * 100) : 0

  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Status row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
            style={{
              background: isSubmitted ? 'var(--success-bg)' : 'var(--warning-bg)',
              color:      isSubmitted ? 'var(--success)'    : 'var(--warning)',
            }}
          >
            {isSubmitted
              ? <><CheckCircle size={14} /> تم التسليم</>
              : <><Clock size={14} /> لم يُسلَّم بعد</>}
          </span>
          {submittedAt && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {submittedAt}
            </span>
          )}
        </div>

        {showScore && (
          <div className="text-end">
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
              درجة الاختيار
            </p>
            <p className="text-3xl font-black leading-none" style={{ color: 'var(--accent)' }}>
              {mcqScore}
              <span className="text-sm font-normal ms-1" style={{ color: 'var(--muted)' }}>
                / {mcqTotal}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Animated progress bar */}
      {showScore && (
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.35 }}
          />
        </div>
      )}

      {/* Teacher note */}
      {teacherNote && teacherNote.trim() !== '' && (
        <div
          className="flex gap-3 items-start rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-strong)' }}
        >
          <MessageSquare size={16} color="var(--accent)" className="flex-shrink-0 mt-0.5" />
          <p style={{ color: 'var(--fg)' }}>{teacherNote}</p>
        </div>
      )}
    </motion.div>
  )
}
