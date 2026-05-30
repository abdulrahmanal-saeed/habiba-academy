import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { MediaBuyerNotification } from '../types'
import { cardItem } from '../animations'

interface Props { notification: MediaBuyerNotification }

export const NotificationCard: FC<Props> = ({ notification: n }) => {
  const isUnread = !n.read_at

  return (
    <motion.div
      variants={cardItem}
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{
        background:   'var(--surface)',
        border:       `1px solid ${isUnread ? 'var(--accent)' : 'var(--border)'}`,
        borderInlineStart: `3px solid ${isUnread ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{n.title}</span>
        {isUnread && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            جديد
          </span>
        )}
      </div>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{n.body}</p>
      {n.url && (
        <a
          href={n.url}
          className="self-start text-xs font-medium underline underline-offset-2"
          style={{ color: 'var(--accent)' }}
        >
          {n.action_label ?? 'عرض'}
        </a>
      )}
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        {new Date(n.created_at).toLocaleDateString('ar-AE', { year: 'numeric', month: 'short', day: 'numeric' })}
      </span>
    </motion.div>
  )
}
