import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, Target } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import type { PortalStats } from '../types'

interface PortalsGridProps {
  portals: PortalStats
}

interface PortalCard {
  label: string
  to: string
  icon: FC<{ size?: number }>
  value: number
  sub: string
}

export const PortalsGrid: FC<PortalsGridProps> = ({ portals }) => {
  const cards: PortalCard[] = [
    { label: 'Academies',     to: '/owner/academies',    icon: Building2, value: portals.academies,       sub: `${portals.academy_students} linked students` },
    { label: 'Parents',       to: '/owner/parents',      icon: Users,     value: portals.parents,          sub: `${portals.parent_students} linked students` },
    { label: 'Media Buyers',  to: '/owner/media-buyers', icon: Target,    value: portals.media_buyers,     sub: 'active partners' },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {cards.map(({ label, to, icon: Icon, value, sub }) => (
        <motion.div key={label} variants={cardVariant}>
          <Link
            to={to}
            className="block rounded-2xl p-4 no-underline"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--accent)' }}>
                <Icon size={15} />
              </div>
            </div>
            <div className="text-3xl font-black" style={{ color: 'var(--fg)' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
