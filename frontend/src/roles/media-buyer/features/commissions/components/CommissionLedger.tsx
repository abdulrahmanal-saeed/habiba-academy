import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { CommissionRow } from '../types'
import { CommissionStatusBadge } from './CommissionStatusBadge'
import { rowStagger, rowItem } from '../animations'

interface Props { commissions: CommissionRow[] }

export const CommissionLedger: FC<Props> = ({ commissions }) => {
  if (commissions.length === 0) {
    return (
      <div
        className="rounded-2xl py-16 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          لا توجد سجلات عمولة بعد
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        <span>المبلغ (AED)</span>
        <span className="text-center">الحالة</span>
        <span className="text-end">التاريخ</span>
      </div>
      <motion.ul
        variants={rowStagger}
        initial="hidden"
        animate="visible"
        className="list-none p-0 m-0"
      >
        {commissions.map((row) => (
          <motion.li
            key={row.id}
            variants={rowItem}
            className="grid grid-cols-3 items-center px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {parseFloat(row.commission_amount_aed).toFixed(2)}
            </span>
            <span className="flex justify-center">
              <CommissionStatusBadge status={row.status} />
            </span>
            <span className="text-xs text-end" style={{ color: 'var(--muted)' }}>
              {new Date(row.created_at).toLocaleDateString('ar-AE', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}
