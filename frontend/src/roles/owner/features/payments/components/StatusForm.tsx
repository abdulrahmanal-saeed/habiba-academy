import { useState } from 'react'
import type { FC } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import type { CheckoutOrder, PaymentStatus } from '../types'

const STATUSES: PaymentStatus[] = ['pending', 'pending_verification', 'paid', 'failed', 'refunded']

interface StatusFormProps {
  order: CheckoutOrder
  onUpdateStatus: (status: PaymentStatus) => Promise<void>
  onCheckZiina: () => Promise<void>
  isSaving: boolean
  isChecking: boolean
  message: string
}

export const StatusForm: FC<StatusFormProps> = ({ order, onUpdateStatus, onCheckZiina, isSaving, isChecking, message }) => {
  const [selected, setSelected] = useState<PaymentStatus>(order.payment_status)

  async function handleSave(): Promise<void> {
    await onUpdateStatus(selected)
  }

  return (
    <div className="flex flex-col gap-3">
      {message && (
        <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={() => void onCheckZiina()}
        disabled={isChecking}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: isChecking ? 'not-allowed' : 'pointer', opacity: isChecking ? 0.6 : 1 }}
      >
        <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
        {isChecking ? 'Checking…' : 'Check Ziina Status'}
      </button>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Status</label>
        <select
          className="w-full rounded-xl px-3 py-2 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
          value={selected}
          onChange={(e) => setSelected(e.target.value as PaymentStatus)}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving || selected === order.payment_status}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold"
        style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          cursor: (isSaving || selected === order.payment_status) ? 'not-allowed' : 'pointer',
          opacity: (isSaving || selected === order.payment_status) ? 0.6 : 1,
        }}
      >
        <Save size={12} />
        {isSaving ? 'Saving…' : 'Save Status'}
      </button>

      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Only mark as paid after verifying in Ziina dashboard.
      </p>
    </div>
  )
}
