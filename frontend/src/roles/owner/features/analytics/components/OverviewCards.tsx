import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Eye, Users, MousePointer, Activity } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import type { AnalyticsOverview } from '../types'

interface OverviewCardsProps {
  overview: AnalyticsOverview
}

export const OverviewCards: FC<OverviewCardsProps> = ({ overview }) => {
  const cards = [
    { label: 'Total Visits',      value: overview.total_visits.toLocaleString(),     icon: Eye,          accent: true },
    { label: 'Unique Visitors',   value: overview.unique_visitors.toLocaleString(),  icon: Users,        accent: false },
    { label: 'Page Views',        value: overview.page_views.toLocaleString(),        icon: MousePointer, accent: false },
    { label: 'Active Now',        value: String(overview.active_now),                icon: Activity,     accent: false },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {cards.map(({ label, value, icon: Icon, accent }) => (
        <motion.div
          key={label}
          variants={cardVariant}
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{
            background: accent ? 'var(--accent-soft)' : 'var(--surface)',
            border: `1px solid ${accent ? 'rgba(13,79,79,0.18)' : 'var(--border)'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: accent ? 'var(--accent)' : 'var(--bg)', color: accent ? '#fff' : 'var(--accent)' }}
            >
              <Icon size={15} />
            </div>
          </div>
          <div className="text-3xl font-black" style={{ color: accent ? 'var(--accent)' : 'var(--fg)' }}>{value}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}
