import { motion } from 'framer-motion'
import type { FC } from 'react'
import { AlertCircle } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import type { LowActivityStudent } from '../types'

interface LowActivityListProps {
  students: LowActivityStudent[]
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Never logged in'
  const d = new Date(lastSeen)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

export const LowActivityList: FC<LowActivityListProps> = ({ students }) => {
  if (students.length === 0) {
    return (
      <div className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>
        All students are active — great!
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
      {students.map((s) => (
        <motion.div
          key={s.id}
          variants={listItem}
          className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{s.full_name}</div>
              <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{s.login_code}</div>
            </div>
          </div>
          <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>
            {formatLastSeen(s.last_seen)}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}
