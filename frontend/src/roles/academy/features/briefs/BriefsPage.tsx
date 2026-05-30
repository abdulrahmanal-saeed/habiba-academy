import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useBriefs } from './hooks/useBriefs'
import { BriefCard } from './components/BriefCard'
import { pageVariant, cardStagger } from './animations'

export const BriefsPage: FC = () => {
  const { data, isLoading, error } = useBriefs()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          تعذّر تحميل البريفات. يُرجى المحاولة مجدداً.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>بريفات الطلاب</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            تتبع البريفات المقدمة للمعلمة
          </p>
        </div>
        <Link
          to="/academy/briefs/new"
          className="rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--surface)' }}
        >
          + بريف جديد
        </Link>
      </div>

      {/* List */}
      {data.briefs.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            لا توجد بريفات بعد
          </p>
          <Link
            to="/academy/briefs/new"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: 'var(--accent)' }}
          >
            إرسال أول بريف
          </Link>
        </div>
      ) : (
        <motion.div
          variants={cardStagger}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2"
        >
          {data.briefs.map((b) => <BriefCard key={b.id} brief={b} />)}
        </motion.div>
      )}
    </motion.div>
  )
}
