import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { useMediaBuyerNotifications, useMarkAllRead } from './hooks/useMediaBuyerNotifications'
import { NotificationCard } from './components/NotificationCard'
import { pageVariant, cardStagger } from './animations'

export const MediaBuyerNotificationsPage: FC = () => {
  const { data, isLoading, error } = useMediaBuyerNotifications()
  const markAll = useMarkAllRead()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          تعذّر تحميل الإشعارات.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>الإشعارات</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {data.unread_count > 0 ? `${data.unread_count} غير مقروء` : 'كل الإشعارات مقروءة'}
          </p>
        </div>
        {data.unread_count > 0 && (
          <motion.button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            تحديد الكل كمقروء
          </motion.button>
        )}
      </div>

      {data.notifications.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>لا توجد إشعارات بعد</p>
        </div>
      ) : (
        <motion.div
          variants={cardStagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3"
        >
          {data.notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
