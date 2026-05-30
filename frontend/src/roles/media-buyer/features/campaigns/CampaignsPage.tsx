import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { useMediaBuyerStats } from './hooks/useMediaBuyerStats'
import { SourceBreakdownList } from './components/SourceBreakdownList'
import { DeviceBreakdownList } from './components/DeviceBreakdownList'
import { RecentVisitsTable } from './components/RecentVisitsTable'
import { pageVariant } from './animations'

export const CampaignsPage: FC = () => {
  const { data, isLoading, error } = useMediaBuyerStats()

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
          تعذّر تحميل بيانات الحملات.
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
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>تحليلات الحملات</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
          مصادر الزيارات، الأجهزة، وآخر النشاطات
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SourceBreakdownList sources={data.sources} />
        <DeviceBreakdownList devices={data.devices} />
      </div>

      <RecentVisitsTable visits={data.recent_visits} />
    </motion.div>
  )
}
