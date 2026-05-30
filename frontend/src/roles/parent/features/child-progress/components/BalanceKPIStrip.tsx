import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { ChildBalance } from '../types'
import { kpiStagger, kpiItem } from '../animations'

interface Props {
  balance: ChildBalance
}

interface KPICardProps {
  label: string
  value: number
}

const KPICard: FC<KPICardProps> = ({ label, value }) => (
  <motion.div
    variants={kpiItem}
    className="flex flex-col items-center rounded-xl py-4 px-2"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
      {value}
    </span>
    <span className="mt-1 text-xs text-center" style={{ color: 'var(--muted)' }}>
      {label}
    </span>
  </motion.div>
)

export const BalanceKPIStrip: FC<Props> = ({ balance }) => {
  const total = balance.contract_sessions || 1
  const pct = Math.min(Math.round((balance.completed_sessions / total) * 100), 100)

  return (
    <div className="flex flex-col gap-4">
      {/* Package meta */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {balance.package_name && (
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {balance.package_name}
          </span>
        )}
        {balance.expiry_date && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            ينتهي:{' '}
            {new Date(balance.expiry_date).toLocaleDateString('ar-AE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* KPI grid */}
      <motion.div
        variants={kpiStagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-3"
      >
        <KPICard label="جلسات مكتملة" value={balance.completed_sessions} />
        <KPICard label="جلسات متبقية" value={balance.remaining_sessions} />
        <KPICard label="إجمالي العقد" value={balance.contract_sessions} />
      </motion.div>

      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
          <span>التقدم</span>
          <span>{pct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
          />
        </div>
      </div>
    </div>
  )
}
