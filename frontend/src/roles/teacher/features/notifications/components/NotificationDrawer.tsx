import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { X, CheckCheck } from 'lucide-react'
import { drawerVariant, stagger, modalBackdrop } from '@/design-system/animations'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
}

export const NotificationDrawer: FC<NotificationDrawerProps> = ({ open, onClose }) => {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, isMarkingAll } = useNotifications()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              zIndex: 300,
            }}
          />
          <motion.aside
            key="drawer"
            variants={drawerVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              position: 'fixed', insetBlockStart: 0, insetInlineEnd: 0,
              width: 360, height: '100dvh',
              background: 'var(--bg)',
              borderInlineStart: '1px solid var(--border)',
              zIndex: 301,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={isMarkingAll}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ color: 'var(--accent)', background: 'var(--accent-soft)', border: 'none', cursor: 'pointer' }}
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
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

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>No notifications</p>
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible">
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
