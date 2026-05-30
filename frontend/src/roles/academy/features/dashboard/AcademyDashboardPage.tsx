import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useAcademyHome } from './hooks/useAcademyHome'
import { AcademyKPIStrip } from './components/AcademyKPIStrip'
import { AcademyStudentList } from './components/AcademyStudentList'
import { pageVariant } from './animations'

export const AcademyDashboardPage: FC = () => {
  const { data, isLoading, error } = useAcademyHome()

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
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
            {data.academy.name}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            لوحة تحكم الأكاديمية الشريكة
          </p>
        </div>
        <Link
          to="/academy/briefs/new"
          className="rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--surface)' }}
        >
          + بريف جديد
        </Link>
      </div>

      {/* KPI strip */}
      <AcademyKPIStrip kpis={data.kpis} />

      {/* Student list */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            الطلاب المرتبطون
          </h2>
          <Link to="/academy/students" className="text-xs" style={{ color: 'var(--accent)' }}>
            عرض الكل ←
          </Link>
        </div>
        <div
          className="rounded-2xl px-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <AcademyStudentList students={data.students} />
        </div>
      </section>
    </motion.div>
  )
}
