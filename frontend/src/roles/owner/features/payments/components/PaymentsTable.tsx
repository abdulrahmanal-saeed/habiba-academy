import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import type { CheckoutOrder } from '../types'

interface PaymentsTableProps {
  orders: CheckoutOrder[]
  onSelect: (order: CheckoutOrder) => void
}

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const PaymentsTable: FC<PaymentsTableProps> = ({ orders, onSelect }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-sm" style={{ color: 'var(--muted)' }}>
        No payments found.
      </div>
    )
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {['Reference', 'Customer', 'Plan', 'Amount', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="text-start px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr
                key={order.id}
                style={{
                  borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
              >
                <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: 'var(--muted)' }}>{order.checkout_reference}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{order.full_name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{order.email}</div>
                </td>
                <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--fg)' }}>{order.selected_plan}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                  AED {Number(order.amount_aed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3"><PaymentStatusBadge status={order.payment_status} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{formatDate(order.created_at)}</td>
                <td className="px-4 py-3 text-end">
                  <button
                    type="button"
                    onClick={() => onSelect(order)}
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
