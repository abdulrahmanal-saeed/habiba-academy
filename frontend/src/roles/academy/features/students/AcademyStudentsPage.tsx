import { motion } from 'framer-motion'
import { useState } from 'react'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { useAcademyStudents } from './hooks/useAcademyStudents'
import { StudentStatusRow } from './components/StudentStatusRow'
import { pageVariant, rowStagger } from './animations'

export const AcademyStudentsPage: FC = () => {
  const { data, isLoading, error } = useAcademyStudents()
  const [search, setSearch] = useState('')

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
          تعذّر تحميل الطلاب. يُرجى المحاولة مجدداً.
        </p>
      </div>
    )
  }

  const filtered = search.trim()
    ? data.students.filter((s) =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.login_code.toLowerCase().includes(search.toLowerCase()),
      )
    : data.students

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>الطلاب</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {data.kpis.student_count} طالب مرتبط
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="ابحث باسم الطالب أو كود الدخول…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
      />

      {/* List */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
          {search ? 'لا نتائج لهذا البحث' : 'لا يوجد طلاب مرتبطون بعد'}
        </p>
      ) : (
        <motion.ul
          variants={rowStagger}
          initial="hidden"
          animate="visible"
          className="list-none p-0 m-0"
        >
          {filtered.map((s) => <StudentStatusRow key={s.id} student={s} />)}
        </motion.ul>
      )}
    </motion.div>
  )
}
