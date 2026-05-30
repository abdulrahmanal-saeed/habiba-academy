import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { useAcademyNotifications, useMarkAllRead } from './hooks/useAcademyNotifications'
import { NotificationCard } from './components/NotificationCard'
import { pageVariant, listStagger } from './animations'

export const AcademyNotificationsPage: FC = () => {
  const { data, isLoading, error } = useAcademyNotifications()
  const { mutate: markRead, isPending } = useMarkAllRead()

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
          تعذّر تحميل الإشعارات. يُرجى المحاولة مجدداً.
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
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>الإشعارات</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {data.unread_count > 0 ? `${data.unread_count} غير مقروءة` : 'كل الإشعارات مقروءة'}
          </p>
        </div>
        {data.unread_count > 0 && (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => markRead()}
            disabled={isPending}
            className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            تحديد الكل كمقروء
          </motion.button>
        )}
      </div>

      {/* List */}
      {data.notifications.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
          لا توجد إشعارات بعد
        </p>
      ) : (
        <motion.div
          variants={listStagger}
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
