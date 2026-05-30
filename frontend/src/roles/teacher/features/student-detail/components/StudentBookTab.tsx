import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import { getBookSubmissions } from '../api'
import type { StudentBookSubmission } from '../types'

interface StudentBookTabProps {
  studentId: number
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  submitted: 'Submitted',
  needs_correction: 'Needs correction',
  feedback_sent: 'Feedback sent',
  completed: 'Completed',
  resubmitted: 'Resubmitted',
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'var(--muted)',
  in_progress: 'var(--warning, #d97706)',
  submitted: 'var(--accent)',
  needs_correction: 'var(--error)',
  feedback_sent: 'var(--success)',
  completed: 'var(--success)',
  resubmitted: 'var(--accent)',
}

const DONE = ['feedback_sent', 'completed']

export const StudentBookTab: FC<StudentBookTabProps> = ({ studentId }) => {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['student-book-submissions', studentId],
    queryFn: () => getBookSubmissions(studentId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const completed = submissions.filter((s) => DONE.includes(s.status)).length
  const pct = submissions.length > 0 ? Math.round((completed / submissions.length) * 100) : 0

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      {submissions.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--muted)' }}>
          No book activity yet
        </p>
      ) : (
        <>
          {/* Progress summary */}
          <div
            className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span style={{ color: 'var(--accent)' }}><BookOpen size={18} /></span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Book progress</span>
                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{completed}/{submissions.length}</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'var(--accent)', borderRadius: 9999 }}
                />
              </div>
            </div>
          </div>

          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
            {submissions.map((item: StudentBookSubmission) => (
              <motion.div
                key={item.id}
                variants={listItem}
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>
                    {item.lesson_number}. {item.lesson_title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>{item.book_title}</span>
                    {item.submitted_at && (
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.submitted_at}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {item.teacher_score ?? item.auto_score}%
                  </span>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-soft)', color: STATUS_COLOR[item.status] ?? 'var(--muted)' }}
                  >
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
