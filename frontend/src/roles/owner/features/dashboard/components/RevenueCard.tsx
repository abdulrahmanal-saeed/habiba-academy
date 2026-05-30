import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { cardVariant } from '@/design-system/animations'
import type { RevenueStats } from '../types'

interface RevenueCardProps {
  revenue: RevenueStats
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'var(--success)',
  pending: 'var(--warning)',
  pending_verification: 'var(--warning)',
  failed: 'var(--danger)',
  refunded: 'var(--muted)',
}

export const RevenueCard: FC<RevenueCardProps> = ({ revenue }) => (
  <motion.div
    variants={cardVariant}
    initial="hidden"
    animate="visible"
    className="rounded-2xl p-4 flex flex-col gap-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Revenue</span>
      <Link to="/owner/payments" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>View all →</Link>
    </div>

    <div>
      <div className="text-3xl font-black" style={{ color: 'var(--fg)' }}>
        AED {revenue.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
        {revenue.paid_orders} paid · {revenue.pending_orders} pending
      </div>
    </div>

    {revenue.by_plan.length > 0 && (
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>By plan</div>
        {revenue.by_plan.map((p) => (
          <div key={p.selected_plan} className="flex items-center justify-between">
            <span className="text-xs capitalize" style={{ color: 'var(--fg)' }}>{p.selected_plan}</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              AED {Number(p.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    )}

    {revenue.by_status.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {revenue.by_status.map((s) => (
          <span
            key={s.payment_status}
            className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
            style={{ background: 'var(--bg)', color: STATUS_COLORS[s.payment_status] ?? 'var(--fg)', border: '1px solid var(--border)' }}
          >
            {s.payment_status.replace('_', ' ')} ({s.total})
          </span>
        ))}
      </div>
    )}
  </motion.div>
)
