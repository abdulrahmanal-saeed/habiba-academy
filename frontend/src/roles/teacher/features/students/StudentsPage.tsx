import { useState, useMemo } from 'react'
import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { stagger, cardVariant, fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { getStudents } from './api'
import { StudentCard } from './components/StudentCard'
import { StudentFilters } from './components/StudentFilters'

type ActiveTab = 'active' | 'inactive'

export const StudentsPage: FC = () => {
  const [query, setQuery] = useState('')
  const [tab,   setTab]   = useState<ActiveTab>('active')

  const { data: students = [], isLoading, isError } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: getStudents,
    staleTime: 120_000,
  })

  const activeStudents   = useMemo(() => students.filter((s) => s.is_active),  [students])
  const inactiveStudents = useMemo(() => students.filter((s) => !s.is_active), [students])

  const filtered = useMemo(() => {
    const pool = tab === 'active' ? activeStudents : inactiveStudents
    if (!query.trim()) return pool
    const q = query.toLowerCase()
    return pool.filter(
      (s) => s.full_name.toLowerCase().includes(q) || s.login_code.toLowerCase().includes(q),
    )
  }, [tab, activeStudents, inactiveStudents, query])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>Failed to load students</p>
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
      {/* Header */}
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Students</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {activeStudents.length} active · {inactiveStudents.length} inactive
        </p>
      </div>

      {/* Filters */}
      <StudentFilters
        query={query}
        tab={tab}
        activeCount={activeStudents.length}
        inactiveCount={inactiveStudents.length}
        onQueryChange={setQuery}
        onTabChange={setTab}
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {query ? `No students match "${query}"` : `No ${tab} students`}
          </p>
        </div>
      ) : (
        <>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filtered.map((s) => (
              <motion.div key={s.id} variants={cardVariant}>
                <StudentCard student={s} />
              </motion.div>
            ))}
          </motion.div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </motion.div>
  )
}
