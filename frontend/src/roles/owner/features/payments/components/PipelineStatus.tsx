import type { FC } from 'react'
import type { CheckoutOrder } from '../types'

interface PipelineStatusProps {
  order: CheckoutOrder
}

const STEPS: Array<{ label: string; key: keyof CheckoutOrder }> = [
  { label: 'Payment',       key: 'payment_status' },
  { label: 'Student Form',  key: 'student_form_status' },
  { label: 'Level Check',   key: 'level_check_status' },
  { label: 'Schedule',      key: 'schedule_status' },
  { label: 'Teacher Review', key: 'teacher_review_status' },
]

function statusColor(value: string): string {
  if (value === 'paid' || value === 'completed' || value === 'submitted') return 'var(--success)'
  if (value.includes('pending') || value.includes('pending_verification')) return 'var(--warning)'
  if (value === 'failed') return 'var(--danger)'
  return 'var(--muted)'
}

export const PipelineStatus: FC<PipelineStatusProps> = ({ order }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
    {STEPS.map(({ label, key }) => {
      const value = String(order[key] ?? 'unknown')
      return (
        <div key={key} className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div
            className="w-6 h-6 rounded-full mb-2 flex items-center justify-center text-xs font-bold"
            style={{ background: `${statusColor(value)}22`, color: statusColor(value) }}
          >
            ✓
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
          <div className="text-xs font-semibold capitalize mt-0.5" style={{ color: statusColor(value) }}>
            {value.replace(/_/g, ' ')}
          </div>
        </div>
      )
    })}
  </div>
)
