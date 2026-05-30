import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { useMediaBuyerHome } from '../dashboard/hooks/useMediaBuyerHome'
import { TrackingLinkRow } from './components/TrackingLinkRow'
import { pageVariant, rowStagger } from './animations'

const LABELS: Array<{ key: 'home' | 'pricing' | 'checkout_single' | 'checkout_monthly' | 'checkout_bundle'; label: string }> = [
  { key: 'home',             label: 'الصفحة الرئيسية' },
  { key: 'pricing',          label: 'قسم الأسعار' },
  { key: 'checkout_single',  label: 'اشتراك فردي (80 AED)' },
  { key: 'checkout_monthly', label: 'الاشتراك الشهري' },
  { key: 'checkout_bundle',  label: 'باقة 30 ساعة' },
]

export const TrackingPage: FC = () => {
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
          تعذّر تحميل الروابط.
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>روابط التتبع</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
          استخدم هذه الروابط في حملاتك لتتبع الزيارات والتحويلات
        </p>
      </div>

      <motion.div
        variants={rowStagger}
        initial="hidden"
        animate="visible"
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {LABELS.map(({ key, label }) => (
          <TrackingLinkRow key={key} label={label} url={data.links[key]} />
        ))}
      </motion.div>
    </motion.div>
  )
}
