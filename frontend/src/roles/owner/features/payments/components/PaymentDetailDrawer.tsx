import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { X } from 'lucide-react'
import { drawerVariant, modalBackdrop } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { PipelineStatus } from './PipelineStatus'
import { AuditLog } from './AuditLog'
import { StatusForm } from './StatusForm'
import { usePaymentDetail, useUpdateStatus, useCheckZiina } from '../hooks/usePayments'
import type { CheckoutOrder, PaymentStatus, PaymentsFilters } from '../types'

interface PaymentDetailDrawerProps {
  order: CheckoutOrder | null
  open: boolean
  onClose: () => void
  filters: Partial<PaymentsFilters>
}

const Inner: FC<PaymentDetailDrawerProps> = ({ order, onClose, filters }) => {
  const [message, setMessage] = useState('')
  const { data, isLoading } = usePaymentDetail(order?.id ?? null)
  const updateStatus = useUpdateStatus(filters)
  const checkZiina   = useCheckZiina(filters)

  async function handleUpdateStatus(payment_status: PaymentStatus): Promise<void> {
    if (!order) return
    const result = await updateStatus.mutateAsync({ id: order.id, payment_status })
    setMessage(result.message ?? 'Status updated')
  }

  async function handleCheckZiina(): Promise<void> {
    if (!order) return
    const result = await checkZiina.mutateAsync(order.id)
    setMessage(result.message ?? 'Ziina checked')
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="min-w-0">
          <h2 className="text-sm font-bold truncate" style={{ color: 'var(--fg)' }}>{order?.full_name}</h2>
          <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{order?.checkout_reference}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {order && <PaymentStatusBadge status={order.payment_status} />}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-10"><Spinner /></div>
        )}
        {data && (
          <div className="p-4 flex flex-col gap-5">
            {/* Amount */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>Amount</div>
              <div className="text-2xl font-black" style={{ color: 'var(--fg)' }}>
                AED {Number(data.order.amount_aed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--muted)' }}>{data.order.selected_plan} plan</div>
            </div>

            {/* Pipeline */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Pipeline</div>
              <PipelineStatus order={data.order} />
            </div>

            {/* Customer details */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Customer</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Email',   value: data.order.email },
                  { label: 'Phone',   value: data.order.whatsapp },
                  { label: 'Type',    value: data.order.learner_type },
                  { label: 'Goal',    value: data.order.main_goal },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="rounded-xl p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
                    <div className="text-xs font-semibold mt-0.5 truncate" style={{ color: 'var(--fg)' }}>{value}</div>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Status form */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Update Status</div>
              <StatusForm
                order={data.order}
                onUpdateStatus={handleUpdateStatus}
                onCheckZiina={handleCheckZiina}
                isSaving={updateStatus.isPending}
                isChecking={checkZiina.isPending}
                message={message}
              />
            </div>

            {/* Audit log */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Audit Log</div>
              <AuditLog entries={data.audit_logs} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export const PaymentDetailDrawer: FC<PaymentDetailDrawerProps> = (props) => (
  <AnimatePresence>
    {props.open && (
      <>
        <motion.div
          key="bd"
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={props.onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }}
        />
        <motion.aside
          key="drawer"
          variants={drawerVariant}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            position: 'fixed', insetBlockStart: 0, insetInlineEnd: 0,
            width: 480, height: '100dvh',
            background: 'var(--bg)',
            borderInlineStart: '1px solid var(--border)',
            zIndex: 301,
            display: 'flex', flexDirection: 'column',
          }}
        >
          <Inner key={props.order?.id ?? 'none'} {...props} />
        </motion.aside>
      </>
    )}
  </AnimatePresence>
)
