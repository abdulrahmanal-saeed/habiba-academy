import { motion } from 'framer-motion'
import type { FC } from 'react'
import { FileText, MessageSquare, Users, Eye } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import type { EngagementStats } from '../types'

interface KpiGridProps {
  engagement: EngagementStats
  activeNow: number
}

interface KpiItem {
  label: string
  value: number
  sub: string
  icon: FC<{ size?: number }>
  accent?: boolean
}

const KpiCard: FC<KpiItem> = ({ label, value, sub, icon: Icon, accent }) => (
  <motion.div
    variants={cardVariant}
    className="rounded-2xl p-4 flex flex-col gap-2"
    style={{
      background: accent ? 'var(--accent-soft)' : 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(13,79,79,0.18)' : 'var(--border)'}`,
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: accent ? 'var(--accent)' : 'var(--bg)', color: accent ? '#fff' : 'var(--accent)' }}
      >
        <Icon size={15} />
      </div>
    </div>
    <div className="text-3xl font-black" style={{ color: accent ? 'var(--accent)' : 'var(--fg)' }}>
      {value}
    </div>
    <div className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</div>
  </motion.div>
)

export const KpiGrid: FC<KpiGridProps> = ({ engagement, activeNow }) => {
  const items: KpiItem[] = [
    { label: 'Active Students',    value: engagement.active_students,        sub: `${engagement.students_logged_in_today} logged in today`, icon: Users, accent: true },
    { label: 'Online Now',         value: activeNow,                          sub: 'site visitors right now',                               icon: Eye },
    { label: 'HW Today',           value: engagement.hw_submitted_today,      sub: `${engagement.hw_submitted_week} this week`,             icon: FileText },
    { label: 'Reviews This Week',  value: engagement.reviews_submitted_week,  sub: 'student review submissions',                            icon: MessageSquare },
    { label: 'Students This Week', value: engagement.students_logged_in_week, sub: 'logged in at least once',                              icon: Users },
    { label: 'HW This Week',       value: engagement.hw_submitted_week,       sub: 'homework submitted',                                    icon: FileText },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"
    >
      {items.map((item) => <KpiCard key={item.label} {...item} />)}
    </motion.div>
  )
}
