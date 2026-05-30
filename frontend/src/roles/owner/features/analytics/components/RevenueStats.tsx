import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger, cardVariant } from '@/design-system/animations'
import type { RevenueStats as RevenueStatsType } from '../types'

interface RevenueStatsProps {
  revenue: RevenueStatsType
}

const STATUS_COLOR: Record<string, string> = {
  paid: 'var(--success)',
  pending: 'var(--warning)',
  pending_verification: 'var(--warning)',
  failed: 'var(--danger)',
  refunded: 'var(--muted)',
}

export const RevenueStats: FC<RevenueStatsProps> = ({ revenue }) => (
  <div className="flex flex-col gap-5">
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 lg:grid-cols-3"
    >
      {[
        { label: 'Total Paid',     value: `AED ${revenue.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
        { label: 'Paid Orders',    value: String(revenue.paid_orders) },
        { label: 'Pending Orders', value: String(revenue.pending_orders) },
      ].map(({ label, value }) => (
        <motion.div
          key={label}
          variants={cardVariant}
          className="rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
          <div className="text-2xl font-black" style={{ color: 'var(--fg)' }}>{value}</div>
        </motion.div>
      ))}
    </motion.div>

    {revenue.by_plan.length > 0 && (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>By Plan</span>
        </div>
        {revenue.by_plan.map((p) => (
          <div key={p.selected_plan} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <span className="text-sm font-semibold capitalize" style={{ color: 'var(--fg)' }}>{p.selected_plan}</span>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
              <span>{p.total_orders} orders</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>
                AED {Number(p.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}

    {revenue.by_status.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {revenue.by_status.map((s) => (
          <span
            key={s.payment_status}
            className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
            style={{ background: 'var(--surface)', color: STATUS_COLOR[s.payment_status] ?? 'var(--fg)', border: '1px solid var(--border)' }}
          >
            {s.payment_status.replace(/_/g, ' ')} · {s.total}
          </span>
        ))}
      </div>
    )}
  </div>
)
