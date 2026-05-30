import { useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { Star, Check, X } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { fadeInUp, stagger, cardVariant } from '@/design-system/animations'
import { useTestimonials, useModerateTestimonial } from './hooks/useTestimonials'
import type { StudentTestimonial, PlatformTestimonial, PublicTestimonial } from './types'

type Tab = 'student' | 'platform' | 'public'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < rating ? 'var(--accent)' : 'none'}
          style={{ color: 'var(--accent)' }}
        />
      ))}
    </span>
  )
}

function StatusBadge({ approved }: { approved: boolean }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: approved ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)',
        color: approved ? 'var(--success)' : 'var(--muted)',
      }}
    >
      {approved ? 'Approved' : 'Pending'}
    </span>
  )
}

function ActionBtns({ onApprove, onReject, loading }: {
  onApprove: () => void; onReject: () => void; loading: boolean
}) {
  return (
    <div className="flex gap-1.5 shrink-0">
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={onApprove}
        disabled={loading}
        className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
        style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--success)', border: 'none', cursor: 'pointer' }}
      >
        <Check size={12} /> Approve
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={onReject}
        disabled={loading}
        className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}
      >
        <X size={12} /> Reject
      </motion.button>
    </div>
  )
}

export const TestimonialsPage: FC = () => {
  const [tab, setTab] = useState<Tab>('platform')
  const { data, isLoading } = useTestimonials()
  const moderate = useModerateTestimonial()

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'platform', label: 'Platform', count: data?.platform.length ?? 0 },
    { key: 'student',  label: 'Student',  count: data?.student.length ?? 0 },
    { key: 'public',   label: 'Public',   count: data?.public.length ?? 0 },
  ]

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-5 p-4">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Testimonials</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors"
            style={{
              background: tab === t.key ? 'var(--accent)' : 'var(--surface)',
              color: tab === t.key ? '#fff' : 'var(--fg)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
        {tab === 'platform' && data?.platform.map((t: PlatformTestimonial) => (
          <motion.div
            key={t.id}
            variants={cardVariant}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{t.public_display_name || 'Anonymous'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars rating={t.rating} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.level}</span>
                  <StatusBadge approved={t.review_status === 'approved'} />
                </div>
              </div>
              {t.review_status !== 'approved' && (
                <ActionBtns
                  loading={moderate.isPending}
                  onApprove={() => moderate.mutate({ id: t.id, action: 'approve', source: 'platform' })}
                  onReject={() => moderate.mutate({ id: t.id, action: 'reject', source: 'platform' })}
                />
              )}
            </div>
            {t.testimonial_text && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-soft)' }}>{t.testimonial_text}</p>
            )}
          </motion.div>
        ))}

        {tab === 'student' && data?.student.map((t: StudentTestimonial) => (
          <motion.div
            key={t.id}
            variants={cardVariant}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{t.student_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars rating={t.rating} />
                  {t.student_level && <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.student_level}</span>}
                  <StatusBadge approved={t.review_status === 'approved'} />
                </div>
              </div>
              {t.review_status !== 'approved' && (
                <ActionBtns
                  loading={moderate.isPending}
                  onApprove={() => moderate.mutate({ id: t.id, action: 'approve', source: 'student' })}
                  onReject={() => moderate.mutate({ id: t.id, action: 'reject', source: 'student' })}
                />
              )}
            </div>
            {t.testimonial_text && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-soft)' }}>{t.testimonial_text}</p>
            )}
          </motion.div>
        ))}

        {tab === 'public' && data?.public.map((t: PublicTestimonial) => (
          <motion.div
            key={t.id}
            variants={cardVariant}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{t.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars rating={t.rating} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.level}</span>
                  <StatusBadge approved={t.is_approved === 1} />
                </div>
              </div>
              {t.is_approved !== 1 && (
                <ActionBtns
                  loading={moderate.isPending}
                  onApprove={() => moderate.mutate({ id: t.id, action: 'approve', source: 'public' })}
                  onReject={() => moderate.mutate({ id: t.id, action: 'reject', source: 'public' })}
                />
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-soft)' }}>{t.message}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
