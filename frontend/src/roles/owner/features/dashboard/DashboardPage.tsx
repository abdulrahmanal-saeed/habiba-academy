import type { FC } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useDashboard } from './hooks/useDashboard'
import { KpiGrid } from './components/KpiGrid'
import { PortalsGrid } from './components/PortalsGrid'
import { RevenueCard } from './components/RevenueCard'

export const DashboardPage: FC = () => {
  const { data, isLoading, isError } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>Failed to load dashboard</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1400px] mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Owner Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: data.active_now > 0 ? 'var(--success)' : 'var(--muted)' }}
          />
          <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            {data.active_now} online
          </span>
        </div>
      </div>

      <KpiGrid engagement={data.engagement} activeNow={data.active_now} />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <PortalsGrid portals={data.portals} />
        <RevenueCard revenue={data.revenue} />
      </div>
    </motion.div>
  )
}
