import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { slideUp } from '@/design-system/animations'
import { subscribeToasts, dismissToast } from './toast.store'
import type { ToastItemData, ToastVariant } from './toast.store'

export type { ToastVariant, ToastItemData }

/* ── Variant config ─────────────────────────────────────────────── */
const CONFIG: Record<ToastVariant, { icon: FC<{ size: number }>; bg: string; color: string }> = {
  success: { icon: CheckCircle,   bg: 'var(--success-bg)', color: 'var(--success)' },
  error:   { icon: AlertCircle,   bg: 'var(--danger-bg)',  color: 'var(--danger)'  },
  warning: { icon: AlertTriangle, bg: 'var(--warning-bg)', color: 'var(--warning)' },
  info:    { icon: Info,          bg: 'var(--info-bg)',    color: 'var(--info)'    },
}

/* ── Single Toast item ──────────────────────────────────────────── */
interface ToastProps extends ToastItemData {
  onDismiss: (id: string) => void
}

const ToastItem: FC<ToastProps> = ({ id, variant, message, duration, onDismiss }) => {
  const { icon: Icon, bg, color } = CONFIG[variant]

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(t)
  }, [id, duration, onDismiss])

  return (
    <motion.div
      layout
      variants={slideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ background: bg, borderColor: color }}
      className="flex items-start gap-3 min-w-[280px] max-w-sm w-full border rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-lg)]"
      role="alert"
      aria-live="assertive"
    >
      <span style={{ color }} className="shrink-0 mt-0.5">
        <Icon size={18} />
      </span>
      <p style={{ color: 'var(--ink)' }} className="flex-1 text-sm font-medium leading-snug">
        {message}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(id)}
        style={{ color: 'var(--muted)' }}
        className="shrink-0 hover:text-ink transition-colors -mt-0.5 -me-0.5 p-1 rounded"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

/* ── Container — render once at app root ────────────────────────── */
export const ToastContainer: FC = () => {
  const [items, setItems] = useState<ToastItemData[]>([])

  useEffect(() => subscribeToasts(setItems), [])

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-4 end-4 z-[2000] flex flex-col-reverse gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {items.map(item => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem {...item} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
