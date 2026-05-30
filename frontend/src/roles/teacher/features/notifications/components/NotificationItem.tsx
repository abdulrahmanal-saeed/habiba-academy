import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText, MessageSquare, Bell } from 'lucide-react'
import { listItem } from '@/design-system/animations'
import type { TeacherNotification } from '../types'

interface NotificationItemProps {
  notification: TeacherNotification
  onMarkRead: (id: number) => void
}

function typeIcon(type: string) {
  if (type.includes('submission') || type.includes('review')) return <FileText size={15} />
  if (type.includes('book'))     return <BookOpen size={15} />
  if (type.includes('scenario')) return <MessageSquare size={15} />
  return <Bell size={15} />
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const NotificationItem: FC<NotificationItemProps> = ({ notification, onMarkRead }) => {
  const navigate = useNavigate()
  const { id, title, body, url, priority, is_read, created_at, notification_type } = notification

  function handleClick(): void {
    if (!is_read) onMarkRead(id)
    if (url) navigate(url)
  }

  return (
    <motion.div
      variants={listItem}
      onClick={handleClick}
      className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer"
      style={{
        background: is_read ? 'transparent' : 'var(--accent-soft)',
        borderBottom: '1px solid var(--border)',
      }}
      whileHover={{ background: 'var(--surface-2, var(--border))' }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 mt-0.5"
        style={{
          background: priority === 'high' ? 'var(--error-soft, rgba(239,68,68,0.1))' : 'var(--accent-soft)',
          color: priority === 'high' ? 'var(--error)' : 'var(--accent)',
        }}
      >
        {typeIcon(notification_type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{title}</p>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{body}</p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(created_at)}</span>
        {!is_read && (
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
        )}
      </div>
    </motion.div>
  )
}
