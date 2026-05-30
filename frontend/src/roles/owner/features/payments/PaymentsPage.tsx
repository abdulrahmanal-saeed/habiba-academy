import { useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { usePaymentsList } from './hooks/usePayments'
import { PaymentsTable } from './components/PaymentsTable'
import { PaymentDetailDrawer } from './components/PaymentDetailDrawer'
import type { CheckoutOrder, PaymentsFilters, PaymentStatus } from './types'

const STATUS_FILTERS: Array<{ key: PaymentStatus | ''; label: string }> = [
  { key: '',                     label: 'All' },
  { key: 'paid',                 label: 'Paid' },
  { key: 'pending_verification', label: 'Pending Verification' },
  { key: 'pending',              label: 'Pending' },
  { key: 'failed',               label: 'Failed' },
  { key: 'refunded',             label: 'Refunded' },
]

export const PaymentsPage: FC = () => {
  const [filters, setFilters] = useState<PaymentsFilters>({ status: '', q: '' })
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<CheckoutOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading, isError } = usePaymentsList(filters)

  function applySearch(): void {
    setFilters((f) => ({ ...f, q: search }))
  }

  function openDrawer(order: CheckoutOrder): void {
    setSelected(order)
    setDrawerOpen(true)
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1200px] mx-auto"
    >
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Payments</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Review checkout orders and update payment statuses.</p>
      </div>

      {/* Status pills */}
      {data?.stats && (
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ key, label }) => {
            const count = key ? (data.stats[key] ?? 0) : data.total
            const active = filters.status === key
            return (
              <button
                key={key || 'all'}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, status: key }))}
                className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                style={{
                  background: active ? 'var(--accent)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--muted)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                {label} <span style={{ opacity: 0.8 }}>({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="w-full rounded-xl py-2 text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none', paddingInlineStart: 36, paddingInlineEnd: 12 }}
            placeholder="Search reference, name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applySearch() }}
          />
        </div>
        <button
          type="button"
          onClick={applySearch}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Search
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10"><Spinner /></div>
      )}
      {isError && (
        <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>Failed to load payments.</p>
      )}
      {data && (
        <PaymentsTable orders={data.orders} onSelect={openDrawer} />
      )}

      <PaymentDetailDrawer
        order={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
      />
    </motion.div>
  )
}
