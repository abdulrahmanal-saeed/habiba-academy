import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { MediaBuyerKPIs, MediaBuyerProfile } from '../types'
import { kpiStagger, kpiItem } from '../animations'

interface KPICard { label: string; value: string }

const card = (label: string, value: string | number): KPICard => ({
  label,
  value: String(value),
})

const buildCards = (kpis: MediaBuyerKPIs, commissionRate: string | null): KPICard[] => [
  card('الطلبات المنسوبة',      kpis.orders_count),
  card('الطلبات المدفوعة',      kpis.paid_count),
  card('نسبة العمولة',          commissionRate ? `${commissionRate}%` : '0%'),
  card('فتح الروابط',           kpis.visits),
  card('الجلسات المتتبعة',      kpis.unique_sessions),
  card('متوسط الوقت (ث)',       kpis.avg_duration),
  card('الزوار (30 يوم)',       kpis.visitors_count),
  card('النسب النشطة',          kpis.attribution_count),
  card('التحويلات المنسوبة',    kpis.conversions_count),
]

interface Props {
  kpis: MediaBuyerKPIs
  buyer: MediaBuyerProfile
}

export const KPIStrip: FC<Props> = ({ kpis, buyer }) => {
  const cards = buildCards(kpis, buyer.commission_rate)

  return (
    <motion.div
      variants={kpiStagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-3"
    >
      {cards.map(({ label, value }) => (
        <motion.div
          key={label}
          variants={kpiItem}
          className="flex flex-col gap-1 rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-xl font-extrabold" style={{ color: 'var(--ink)' }}>
            {value}
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {label}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}
