import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { HomeworkItem } from '../types'
import { HomeworkStatusBadge } from './HomeworkStatusBadge'
import { listStagger, listItem } from '../animations'

interface Props {
  items: HomeworkItem[]
}

function displayDate(hw: HomeworkItem): string {
  const raw = hw.publish_at ?? hw.hw_date
  return new Date(raw).toLocaleDateString('ar-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const HomeworkRow: FC<{ hw: HomeworkItem }> = ({ hw }) => (
  <motion.li
    variants={listItem}
    className="flex items-start justify-between gap-3 py-4"
    style={{ borderBottom: '1px solid var(--border)' }}
  >
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>
        {hw.title}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
        {displayDate(hw)}
      </p>
    </div>
    <HomeworkStatusBadge submitted={hw.submitted} submittedAt={hw.submitted_at} />
  </motion.li>
)

export const HomeworkList: FC<Props> = ({ items }) => {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
        لا توجد واجبات بعد
      </p>
    )
  }

  return (
    <motion.ul
      variants={listStagger}
      initial="hidden"
      animate="visible"
      className="list-none p-0 m-0"
    >
      {items.map((hw) => (
        <HomeworkRow key={hw.id} hw={hw} />
      ))}
    </motion.ul>
  )
}
