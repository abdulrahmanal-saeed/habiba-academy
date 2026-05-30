import { useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { buttonTap } from '@/design-system/animations'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationDrawer } from './NotificationDrawer'

export const NotificationBell: FC = () => {
  const [open, setOpen] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        {...buttonTap}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl"
        style={{
          background: open ? 'var(--accent-soft)' : 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--muted)',
          cursor: 'pointer',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -end-1 flex items-center justify-center min-w-[16px] h-4 rounded-full text-[10px] font-bold px-0.5"
            style={{ background: 'var(--error)', color: '#fff' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <NotificationDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
