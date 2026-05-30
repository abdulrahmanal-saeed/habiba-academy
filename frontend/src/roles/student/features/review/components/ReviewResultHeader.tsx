import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant } from '@/design-system/animations'

export interface ReviewResultHeaderProps {
  reviewType: 'weekly_review' | 'monthly_review'
  submittedAt: string
  reviewStatus: 'pending' | 'reviewed'
  effectiveAutoScore: number | null
  manualScore: number | null
  totalScore: number | null
  totalPoints: number | null
  teacherNote: string | null
}

const TYPE_LABEL: Record<string, string> = {
  weekly_review: 'مراجعة أسبوعية',
  monthly_review: 'مراجعة شهرية',
}

export const ReviewResultHeader: FC<ReviewResultHeaderProps> = ({
  reviewType,
  submittedAt,
  reviewStatus,
  effectiveAutoScore,
  manualScore,
  totalScore,
  totalPoints,
  teacherNote,
}) => {
  if (reviewStatus === 'pending') {
    return (
      <motion.div
        variants={cardVariant}
        initial="hidden"
        animate="visible"
        className="rounded-[var(--radius-lg)] p-8 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--fg)' }}>
          قيد المراجعة
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          تم تسليم مراجعتك. سيظهر تقييمك النهائي بعد أن يراجع المعلم الأجزاء الكتابية والشفهية.
        </p>
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
          {TYPE_LABEL[reviewType] ?? reviewType} · سُلّمت {submittedAt}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
        {TYPE_LABEL[reviewType] ?? reviewType} · سُلّمت {submittedAt}
      </p>

      <div className="grid grid-cols-3 gap-4 text-center">
        <ScoreColumn label="التقييم الآلي" value={effectiveAutoScore} />
        <ScoreColumn label="تقييم المعلم" value={manualScore} />
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
            الدرجة النهائية
          </p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
            {totalScore ?? '—'}
            {totalPoints != null && (
              <span className="text-lg font-normal ms-1" style={{ color: 'var(--muted)' }}>
                /{totalPoints}
              </span>
            )}
          </p>
        </div>
      </div>

      {teacherNote && (
        <div
          className="mt-4 rounded-[var(--radius-md)] p-3 text-sm"
          style={{ background: 'var(--accent-soft)', color: 'var(--fg)' }}
        >
          <span className="font-semibold">ملاحظة المعلم: </span>
          {teacherNote}
        </div>
      )}
    </motion.div>
  )
}

const ScoreColumn: FC<{ label: string; value: number | null }> = ({ label, value }) => (
  <div>
    <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
    <p className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>{value ?? '—'}</p>
  </div>
)
