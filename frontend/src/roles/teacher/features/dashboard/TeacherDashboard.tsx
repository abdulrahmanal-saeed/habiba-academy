import { useState } from 'react'
import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { getTeacherDashboard } from './api'
import { KpisRow } from './components/KpisRow'
import { TodayActivity } from './components/TodayActivity'
import { PriorityQueue } from './components/PriorityQueue'
import { CalendarWidget } from './components/CalendarWidget'

export const TeacherDashboard: FC = () => {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-dashboard', month],
    queryFn: () => getTeacherDashboard(month),
    staleTime: 60_000,
  })

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
      className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1200px] mx-auto"
    >
      {/* Page title */}
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <KpisRow kpis={data.kpis} />

      {/* Main content: today activity + right column */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Today activity */}
        <TodayActivity
          homework={data.today_homework}
          scenarios={data.today_scenarios}
          reviews={data.today_reviews}
        />

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <PriorityQueue items={data.priority_queue} />
          <CalendarWidget
            sessions={data.calendar}
            month={month}
            onMonthChange={setMonth}
          />
        </div>
      </div>
    </motion.div>
  )
}
