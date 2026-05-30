import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Calendar,
  FileCheck,
  MessageSquare,
  Star,
} from 'lucide-react'
import type { Notification, NotificationType } from './api'

export interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: number) => void
}

const TYPE_ICON: Record<NotificationType, FC<{ size: number }>> = {
  homework_feedback: FileCheck,
  new_material:      BookOpen,
  lesson_reminder:   Calendar,
  review_result:     Star,
  book_feedback:     MessageSquare,
  general:           Bell,
}

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const NotificationItem: FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const navigate = useNavigate()
  const Icon = TYPE_ICON[notification.type]

  const handleClick = () => {
    if (!notification.isRead) onMarkAsRead(notification.id)
    if (notification.link) navigate(notification.link)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-accent-soft"
      style={{ background: notification.isRead ? 'transparent' : 'var(--accent-soft)' }}
    >
      {/* Type icon */}
      <span
        className="mt-0.5 shrink-0 rounded-full p-1.5"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        <Icon size={14} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: 'var(--muted)' }}>
          {notification.body}
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted-light)' }}>
          {relativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <span
          aria-label="Unread"
          className="mt-2 h-2 w-2 shrink-0 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </button>
  )
}
