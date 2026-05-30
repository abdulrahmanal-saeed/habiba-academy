import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import type { ParentStudent } from '../types'
import { cardItem } from '../animations'

interface Props {
  student: ParentStudent
}

export const StudentBalanceCard: FC<Props> = ({ student }) => {
  const { balance } = student
  const total = balance.contract_sessions || 1
  const pct = Math.min(Math.round((balance.completed_sessions / total) * 100), 100)

  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col gap-4 rounded-2xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
            {student.full_name}
          </h3>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {student.level}
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-xs"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {student.login_code}
        </span>
      </div>

      {/* Package name */}
      {balance.package_name && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {balance.package_name}
        </p>
      )}

      {/* Session KPIs */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {([
          { label: 'مكتملة', value: balance.completed_sessions },
          { label: 'متبقية', value: balance.remaining_sessions },
          { label: 'إجمالي', value: balance.contract_sessions },
        ] as const).map(({ label, value }) => (
          <div key={label} className="rounded-lg py-2" style={{ background: 'var(--bg)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              {value}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      </div>

      {/* Action links */}
      <div className="flex gap-2">
        <Link
          to={`/parent/children/${student.id}/homework`}
          className="flex-1 rounded-lg py-2 text-center text-xs font-medium"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          الواجبات
        </Link>
        <Link
          to={`/parent/children/${student.id}/progress`}
          className="flex-1 rounded-lg py-2 text-center text-xs font-medium"
          style={{ background: 'var(--accent)', color: 'var(--surface)' }}
        >
          التقدم
        </Link>
      </div>
    </motion.div>
  )
}
