import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { AcademyStudent } from '../types'
import { listStagger, listItem } from '../animations'

interface Props { students: AcademyStudent[] }

const StudentRow: FC<{ student: AcademyStudent }> = ({ student }) => (
  <motion.li
    variants={listItem}
    className="flex items-center justify-between gap-3 py-3.5"
    style={{ borderBottom: '1px solid var(--border)' }}
  >
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
        {student.full_name}
      </p>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {student.login_code}
        {student.level ? ` · ${student.level}` : ''}
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-3">
      <div className="text-end">
        <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
          {student.completed_sessions} / {student.upcoming_sessions}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>مكتملة / قادمة</p>
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold"
        style={
          student.is_active
            ? { background: 'var(--success-bg)', color: 'var(--success)' }
            : { background: 'var(--border)', color: 'var(--muted)' }
        }
      >
        {student.is_active ? 'نشط' : 'غير نشط'}
      </span>
    </div>
  </motion.li>
)

export const AcademyStudentList: FC<Props> = ({ students }) => {
  if (students.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
        لا يوجد طلاب مرتبطون بعد
      </p>
    )
  }

  return (
    <motion.ul
      variants={listStagger}
      initial="hidden"
      animate="visible"
      className="list-none p-0 m-0"
    >
      {students.map((s) => <StudentRow key={s.id} student={s} />)}
    </motion.ul>
  )
}
