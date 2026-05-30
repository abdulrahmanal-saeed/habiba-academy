import { useState, useRef, useEffect } from 'react'
import type { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotifications } from './useNotifications'
import { NotificationList } from './NotificationList'

export const NotificationBell: FC = () => {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  /* Close on outside click */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex items-center justify-center h-10 w-10 rounded-[var(--radius)] transition-colors hover:bg-accent-soft"
        style={{ color: 'var(--ink-soft)' }}
      >
        <Bell size={20} />

        {/* Unread count badge with spring animation */}
        <AnimatePresence mode="wait">
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              aria-hidden="true"
              className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              style={{ background: 'var(--danger)' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <NotificationList
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={(id) => { markAsRead(id); }}
            onMarkAllRead={() => { markAllRead(); setIsOpen(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
