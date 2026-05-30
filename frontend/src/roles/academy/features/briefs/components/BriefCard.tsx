import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import type { BriefListItem } from '../types'
import { BriefStatusBadge } from './BriefStatusBadge'
import { cardItem } from '../animations'

interface Props { brief: BriefListItem }

export const BriefCard: FC<Props> = ({ brief }) => (
  <motion.div
    variants={cardItem}
    whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="rounded-2xl p-5 flex flex-col gap-3"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--ink)' }}>
        {brief.student_name}
      </h3>
      <BriefStatusBadge status={brief.brief_status} />
    </div>

    <p className="text-sm line-clamp-2" style={{ color: 'var(--muted)' }}>
      {brief.main_goal}
    </p>

    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        {new Date(brief.created_at).toLocaleDateString('ar-AE', {
          year: 'numeric', month: 'short', day: 'numeric',
        })}
      </span>
      <Link
        to={`/academy/briefs/${brief.id}`}
        className="text-xs font-medium"
        style={{ color: 'var(--accent)' }}
      >
        عرض التفاصيل ←
      </Link>
    </div>
  </motion.div>
)
