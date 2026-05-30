import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useMediaBuyerHome } from './hooks/useMediaBuyerHome'
import { KPIStrip } from './components/KPIStrip'
import { pageVariant } from './animations'

export const MediaBuyerDashboardPage: FC = () => {
  const { data, isLoading, error } = useMediaBuyerHome()

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
          تعذّر تحميل لوحة التحكم.
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
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
          أهلاً، {data.buyer.full_name}
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
          إليك ملخص أداء حملاتك التسويقية
        </p>
      </div>

      {/* KPIs */}
      <KPIStrip kpis={data.kpis} buyer={data.buyer} />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link
          to="/media-buyer/tracking"
          className="rounded-2xl p-4 text-center text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--surface)' }}
        >
          روابط التتبع
        </Link>
        <Link
          to="/media-buyer/campaigns"
          className="rounded-2xl p-4 text-center text-sm font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          تحليلات الحملات
        </Link>
        <Link
          to="/media-buyer/commissions"
          className="rounded-2xl p-4 text-center text-sm font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          سجل العمولات
        </Link>
      </div>
    </motion.div>
  )
}
