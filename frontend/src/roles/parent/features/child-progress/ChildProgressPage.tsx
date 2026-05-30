import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useChildProgress } from './hooks/useChildProgress'
import { BalanceKPIStrip } from './components/BalanceKPIStrip'
import { pageVariant } from './animations'
import type { ChildStats } from './types'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="flex flex-col rounded-xl p-4 gap-0.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
      {sub && <span className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>{sub}</span>}
    </div>
  )
}

function StatsSection({ stats }: { stats: ChildStats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="الواجبات المُنجزة"
        value={stats.hw_count}
        sub={stats.hw_avg_pct !== null ? `متوسط: ${stats.hw_avg_pct}%` : undefined}
      />
      <StatCard
        label="المراجعات"
        value={stats.rv_count}
        sub={stats.rv_avg_pct !== null ? `متوسط: ${stats.rv_avg_pct}%` : undefined}
      />
    </div>
  )
}

export const ChildProgressPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const childId = parseInt(id ?? '0', 10)
  const { data, isLoading, error } = useChildProgress(childId)

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          تعذّر تحميل بيانات التقدم. يُرجى المحاولة مجدداً.
        </p>
      </div>
    )
  }

  const { child, balance, stats } = data

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      <Link to="/parent" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
        ← العودة
      </Link>

      {/* Child header */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{child.full_name}</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{child.level}</p>
      </div>

      {/* Homework + review stats */}
      <StatsSection stats={stats} />

      {/* Session balance */}
      {balance ? (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--fg)' }}>الجلسات</h2>
          <BalanceKPIStrip balance={balance} />
        </div>
      ) : (
        <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>لا يوجد عقد مُسجَّل بعد.</p>
      )}
    </motion.div>
  )
}
