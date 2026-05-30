import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { fadeInUp } from '@/design-system/animations'
import type { BookLesson, LessonStatus } from '@/shared/interactive-book'

const STATUS_LABEL: Record<LessonStatus, string> = {
  draft: 'مسودة',
  in_progress: 'قيد التقديم',
  submitted: 'مُقدَّم',
  needs_correction: 'يحتاج تصحيح',
  feedback_sent: 'تم التقييم',
  completed: 'مكتمل',
  resubmitted: 'أُعيد تقديمه',
}

const STATUS_COLOR: Record<LessonStatus, string> = {
  draft: 'var(--muted)',
  in_progress: 'var(--warning)',
  submitted: 'var(--accent)',
  needs_correction: 'var(--danger)',
  feedback_sent: 'var(--success)',
  completed: 'var(--success)',
  resubmitted: 'var(--accent)',
}

interface LessonRowProps {
  lesson: BookLesson
}

export const LessonRow: FC<LessonRowProps> = ({ lesson }) => {
  const navigate = useNavigate()
  const status = lesson.submission_status ?? null

  return (
    <motion.button
      type="button"
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/student/book/${lesson.id}`)}
      style={{
        width: '100%',
        textAlign: 'start',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem 1.25rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 9999,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          fontWeight: 700,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {lesson.lesson_number}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', margin: 0, direction: 'rtl' }}>
          {lesson.title_ar}
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{lesson.title_en}</p>
      </div>
      {status && (
        <span
          style={{
            flexShrink: 0,
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.25rem 0.625rem',
            borderRadius: 9999,
            background: `${STATUS_COLOR[status]}22`,
            color: STATUS_COLOR[status],
          }}
        >
          {STATUS_LABEL[status]}
        </span>
      )}
    </motion.button>
  )
}
