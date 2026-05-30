import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardVariant } from '@/design-system/animations'
import type { TeacherStudent } from '../types'

interface StudentCardProps {
  student: TeacherStudent
}

function formatLastSeen(dt: string | null): string {
  if (!dt) return 'Never logged in'
  const ts   = new Date(dt).getTime()
  const diff = Math.floor((Date.now() - ts) / 86400000)
  const time = new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diff === 0) return `Today, ${time}`
  if (diff === 1) return `Yesterday, ${time}`
  return `${new Date(dt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}, ${time}`
}

export const StudentCard: FC<StudentCardProps> = ({ student }) => {
  const initial = student.full_name.charAt(0).toUpperCase()
  const { balance } = student
  const navigate = useNavigate()

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-2xl p-4 flex flex-col gap-3 h-full cursor-pointer"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      onClick={() => navigate(`/teacher/students/${student.id}`)}
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0"
          style={{
            background: student.is_active ? 'var(--accent-soft)' : 'var(--bg)',
            color: student.is_active ? 'var(--accent)' : 'var(--muted)',
            border: '1px solid var(--border)',
          }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate" style={{ color: student.is_active ? 'var(--fg)' : 'var(--muted)' }}>
            {student.full_name}
          </div>
          <div className="text-xs font-mono font-bold mt-0.5" style={{ color: 'var(--muted)' }}>
            {student.login_code}
          </div>
          <span
            className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {student.level}
          </span>
        </div>
        {!student.is_active && (
          <span
            className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}
          >
            Inactive
          </span>
        )}
      </div>

      {/* Last seen */}
      <div className="text-xs" style={{ color: 'var(--muted)' }}>
        {formatLastSeen(student.last_seen)}
      </div>

      {/* Balance */}
      {balance ? (
        <div
          className="rounded-xl p-3 flex flex-col gap-1.5"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Package Balance</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {balance.package_name}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--muted)' }}>Used</span>
            <strong style={{ color: 'var(--fg)' }}>{balance.used_sessions} / {balance.contract_sessions}</strong>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--muted)' }}>Remaining</span>
            <strong style={{ color: 'var(--fg)' }}>{balance.remaining_sessions} sessions</strong>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--muted)' }}>Income</span>
            <strong style={{ color: 'var(--fg)' }}>{balance.income_total.toFixed(2)} AED</strong>
          </div>
        </div>
      ) : (
        <div className="text-xs" style={{ color: 'var(--muted)' }}>No package balance yet.</div>
      )}
    </motion.div>
  )
}
