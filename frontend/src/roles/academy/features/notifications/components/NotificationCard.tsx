import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { AcademyNotification } from '../types'
import { listItem } from '../animations'

interface Props { notification: AcademyNotification }

export const NotificationCard: FC<Props> = ({ notification: n }) => (
  <motion.div
    variants={listItem}
    className="rounded-2xl p-4 flex flex-col gap-2"
    style={{
      background: 'var(--surface)',
      border: `1px solid ${n.read_at ? 'var(--border)' : 'var(--accent-soft-strong)'}`,
    }}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--ink)' }}>
        {n.title}
      </p>
      {!n.read_at && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}
        >
          جديد
        </span>
      )}
    </div>

    {n.body && (
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{n.body}</p>
    )}

    <div className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        {new Date(n.created_at).toLocaleDateString('ar-AE', {
          year: 'numeric', month: 'short', day: 'numeric',
        })}
      </span>
      {n.url && (
        <a
          href={n.url}
          className="text-xs font-medium"
          style={{ color: 'var(--accent)' }}
          target="_blank"
          rel="noreferrer"
        >
          {n.action_label ?? 'عرض'}
        </a>
      )}
    </div>
  </motion.div>
)
