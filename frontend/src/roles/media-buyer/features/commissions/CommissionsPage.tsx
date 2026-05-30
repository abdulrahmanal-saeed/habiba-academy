import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { useMediaBuyerStats } from '../campaigns/hooks/useMediaBuyerStats'
import { CommissionLedger } from './components/CommissionLedger'
import { pageVariant } from './animations'

export const CommissionsPage: FC = () => {
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
          تعذّر تحميل سجل العمولات.
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>سجل العمولات</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
          العمولات المحسوبة على الطلبات المدفوعة والمعتمدة
        </p>
      </div>

      <CommissionLedger commissions={data.commissions} />
    </motion.div>
  )
}
