import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Bell } from 'lucide-react'
import { NotificationItem } from './NotificationItem'
import { fadeInDown } from '@/design-system/animations'
import type { Notification } from './api'

export interface NotificationListProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: number) => void
  onMarkAllRead: () => void
}

export const NotificationList: FC<NotificationListProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllRead,
}) => (
  <motion.div
    variants={fadeInDown}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="absolute top-full end-0 mt-2 w-80 overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-50"
    style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
    }}
    role="dialog"
    aria-label="Notifications"
  >
    {/* Header */}
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-soft)' }}
    >
      <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
        Notifications
        {unreadCount > 0 && (
          <span className="ms-2 text-xs font-normal" style={{ color: 'var(--muted)' }}>
            {unreadCount} unread
          </span>
        )}
      </h3>
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-xs font-medium transition-colors hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Mark all read
        </button>
      )}
    </div>

    {/* List */}
    <div className="max-h-96 overflow-y-auto" role="list">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Bell size={32} style={{ color: 'var(--muted-light)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No notifications yet
          </p>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} role="listitem" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <NotificationItem notification={n} onMarkAsRead={onMarkAsRead} />
          </div>
        ))
      )}
    </div>
  </motion.div>
)
