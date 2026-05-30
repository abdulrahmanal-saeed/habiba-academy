import { useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useAnalytics } from './hooks/useAnalytics'
import { OverviewCards } from './components/OverviewCards'
import { DailyChart } from './components/DailyChart'
import { DevicePie } from './components/DevicePie'
import { HourlyHeatmap } from './components/HourlyHeatmap'
import { FunnelChart } from './components/FunnelChart'
import { RevenueStats } from './components/RevenueStats'
import { MediaBuyersTable } from './components/MediaBuyersTable'
import { TopPagesTable } from './components/TopPagesTable'
import { LowActivityList } from './components/LowActivityList'
import { RealtimePanel } from './components/RealtimePanel'
import type { AnalyticsTab } from './types'

const TABS: Array<{ key: AnalyticsTab; label: string }> = [
  { key: 'overview',     label: 'Overview' },
  { key: 'funnel',       label: 'Funnel' },
  { key: 'revenue',      label: 'Revenue' },
  { key: 'engagement',   label: 'Engagement' },
  { key: 'media-buyers', label: 'Media Buyers' },
]

export const AnalyticsPage: FC = () => {
  const [tab, setTab] = useState<AnalyticsTab>('overview')
  const { data, isLoading, isError } = useAnalytics()

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
        <p className="text-sm" style={{ color: 'var(--danger)' }}>Failed to load analytics</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1200px] mx-auto"
    >
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Analytics</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Site traffic, funnel, revenue, and engagement.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="px-4 py-2 text-sm font-semibold"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === key ? 'var(--accent)' : 'var(--muted)',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-5">
          <OverviewCards overview={data.overview} />
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
                Daily Visits (last 30 active days)
              </div>
              <DailyChart data={data.daily_visits} />
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Device Breakdown</div>
              <DevicePie data={data.device_breakdown} />
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Hourly Pattern (last 30 days)</div>
            <HourlyHeatmap data={data.hourly_pattern} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Top Pages</div>
              <TopPagesTable data={data.top_pages} />
            </div>
            <RealtimePanel />
          </div>
        </div>
      )}

      {tab === 'funnel' && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--muted)' }}>Conversion Funnel (last 30 days)</div>
          <FunnelChart funnel={data.funnel} />
        </div>
      )}

      {tab === 'revenue' && <RevenueStats revenue={data.revenue} />}

      {tab === 'engagement' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { label: 'Active Students',      value: data.engagement.active_students },
              { label: 'Online Today',          value: data.engagement.students_logged_in_today },
              { label: 'Online This Week',      value: data.engagement.students_logged_in_week },
              { label: 'HW Submitted Today',    value: data.engagement.hw_submitted_today },
              { label: 'HW Submitted Week',     value: data.engagement.hw_submitted_week },
              { label: 'Reviews This Week',     value: data.engagement.reviews_submitted_week },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
                <div className="text-3xl font-black" style={{ color: 'var(--fg)' }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
              Inactive Students ({'>'} 14 days)
            </div>
            <LowActivityList students={data.low_activity_students} />
          </div>
        </div>
      )}

      {tab === 'media-buyers' && <MediaBuyersTable data={data.media_buyers} />}
    </motion.div>
  )
}
