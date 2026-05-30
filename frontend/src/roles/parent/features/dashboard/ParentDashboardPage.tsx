import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { useParentHome } from './hooks/useParentHome'
import { ParentKPIStrip } from './components/ParentKPIStrip'
import { StudentBalanceCard } from './components/StudentBalanceCard'
import { UpcomingSessionsList } from './components/UpcomingSessionsList'
import { pageVariant, cardStagger, cardItem } from './animations'

export const ParentDashboardPage: FC = () => {
  const { data, isLoading, error } = useParentHome()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          تعذّر تحميل البيانات. يُرجى المحاولة مجدداً.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
          مرحباً، {data.parent.full_name}
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
          إليك ملخص أبنائك في الأكاديمية
        </p>
      </div>

      {/* KPI strip */}
      <ParentKPIStrip
        studentCount={data.kpis.student_count}
        upcomingCount={data.kpis.upcoming_count}
      />

      {/* Student cards */}
      {data.students.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            الأبناء
          </h2>
          <motion.div
            variants={cardStagger}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2"
          >
            {data.students.map((s) => (
              <motion.div key={s.id} variants={cardItem}>
                <StudentBalanceCard student={s} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Upcoming sessions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
          الجلسات القادمة
        </h2>
        <div
          className="rounded-2xl px-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <UpcomingSessionsList sessions={data.upcoming} />
        </div>
      </section>
    </motion.div>
  )
}
