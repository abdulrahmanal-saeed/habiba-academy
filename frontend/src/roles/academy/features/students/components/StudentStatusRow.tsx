import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { AcademyStudent } from '../../dashboard/types'
import { rowItem } from '../animations'

interface Props { student: AcademyStudent }

export const StudentStatusRow: FC<Props> = ({ student }) => (
  <motion.li
    variants={rowItem}
    whileHover={{ backgroundColor: 'var(--bg-alt)' }}
    transition={{ duration: 0.15 }}
    className="flex items-center justify-between gap-4 rounded-xl px-4 py-4"
    style={{ border: '1px solid var(--border)', marginBottom: '0.5rem' }}
  >
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold text-sm" style={{ color: 'var(--ink)' }}>
        {student.full_name}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
        {student.login_code}
        {student.level ? ` · ${student.level}` : ''}
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-base font-bold" style={{ color: 'var(--accent)' }}>
            {student.completed_sessions}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>مكتملة</p>
        </div>
        <div>
          <p className="text-base font-bold" style={{ color: 'var(--info)' }}>
            {student.upcoming_sessions}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>قادمة</p>
        </div>
      </div>

      <span
        className="rounded-full px-2.5 py-1 text-xs font-semibold"
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
