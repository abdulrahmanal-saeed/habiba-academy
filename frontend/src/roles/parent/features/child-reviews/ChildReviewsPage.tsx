import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useChildReviews } from './hooks/useChildReviews'
import { pageVariant, stagger, cardVariant } from './animations'
import type { ChildReviewItem } from './types'

function ReviewBadge({ status }: { status: ChildReviewItem['submission_status'] }) {
  if (!status) return <span className="text-xs" style={{ color: 'var(--muted)' }}>لم تُسلَّم</span>
  const reviewed = status === 'reviewed'
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: reviewed ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)',
        color: reviewed ? 'var(--success)' : '#d97706',
      }}
    >
      {reviewed ? 'تمّت المراجعة' : 'بانتظار المراجعة'}
    </span>
  )
}

export const ChildReviewsPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const childId = parseInt(id ?? '0', 10)
  const { data, isLoading, error } = useChildReviews(childId)

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  }
  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>تعذّر تحميل المراجعات.</p>
      </div>
    )
  }

  const { child, reviews } = data
  const reviewed = reviews.filter((r) => r.submission_status === 'reviewed').length

  return (
    <motion.div variants={pageVariant} initial="hidden" animate="visible" className="flex flex-col gap-5">
      <Link to="/parent" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
        ← العودة
      </Link>

      {/* Child header */}
      <div
        className="flex items-start justify-between gap-3 rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{child.full_name}</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{child.level}</p>
        </div>
        <div className="text-end">
          <span
            className="rounded-full px-2 py-0.5 font-mono text-xs"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {child.login_code}
          </span>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            {reviewed} / {reviews.length} راجع
          </p>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>لا توجد مراجعات بعد.</p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
          {reviews.map((rv) => {
            const pct = rv.total_points > 0 && rv.total_score !== null
              ? Math.round((rv.total_score / rv.total_points) * 100)
              : null

            return (
              <motion.div
                key={rv.id}
                variants={cardVariant}
                className="rounded-2xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>{rv.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {rv.review_date} · {rv.review_type === 'weekly_review' ? 'أسبوعية' : 'شهرية'}
                    </p>
                  </div>
                  <ReviewBadge status={rv.submission_status} />
                </div>

                {pct !== null && (
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 70 ? 'var(--success)' : pct >= 50 ? '#d97706' : 'var(--danger)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: 'var(--ink)' }}>
                      {rv.total_score} / {rv.total_points} ({pct}%)
                    </span>
                  </div>
                )}

                {rv.teacher_note && (
                  <p className="mt-2 text-xs rounded-xl px-3 py-2" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                    📝 {rv.teacher_note}
                  </p>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
