import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger, listItem } from '@/design-system/animations'
import type { AnalyticsFunnel } from '../types'

interface FunnelChartProps {
  funnel: AnalyticsFunnel
}

const STEPS: Array<{ key: keyof AnalyticsFunnel; label: string }> = [
  { key: 'visit',               label: 'Site Visit' },
  { key: 'pricing_view',        label: 'Pricing View' },
  { key: 'checkout_start',      label: 'Checkout Start' },
  { key: 'checkout_submit',     label: 'Checkout Submit' },
  { key: 'payment_pending',     label: 'Payment Pending' },
  { key: 'payment_paid',        label: 'Payment Paid' },
  { key: 'student_form_submit', label: 'Student Form' },
]

export const FunnelChart: FC<FunnelChartProps> = ({ funnel }) => {
  const top = funnel.visit || 1

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
      {STEPS.map(({ key, label }, i) => {
        const value = funnel[key]
        const pct   = Math.round((value / top) * 100)
        const dropPct = i > 0 ? Math.round(((funnel[STEPS[i - 1].key] - value) / Math.max(funnel[STEPS[i - 1].key], 1)) * 100) : 0

        return (
          <motion.div key={key} variants={listItem} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>{label}</span>
              <div className="flex items-center gap-3">
                {i > 0 && dropPct > 0 && (
                  <span style={{ color: 'var(--danger)' }}>−{dropPct}%</span>
                )}
                <span className="font-black" style={{ color: 'var(--accent)' }}>{value.toLocaleString()}</span>
                <span style={{ color: 'var(--muted)' }}>({pct}%)</span>
              </div>
            </div>
            <div className="h-6 rounded-lg overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-lg"
                style={{ background: 'var(--accent)', originX: 0 }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
