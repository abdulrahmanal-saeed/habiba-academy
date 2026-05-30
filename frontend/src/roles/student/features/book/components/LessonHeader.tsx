import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { fadeInDown } from '@/design-system/animations'
import type { LessonStatus, BookLessonMeta } from '@/shared/interactive-book'

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

const PROGRESS_PCT: Record<LessonStatus, number> = {
  draft: 35,
  in_progress: 35,
  submitted: 80,
  needs_correction: 80,
  feedback_sent: 100,
  completed: 100,
  resubmitted: 80,
}

interface LessonHeaderProps {
  lesson: BookLessonMeta
  status: LessonStatus | null
  onSaveDraft: () => void
  saving: boolean
}

export const LessonHeader: FC<LessonHeaderProps> = ({ lesson, status, onSaveDraft, saving }) => {
  const navigate = useNavigate()
  const pct = status ? PROGRESS_PCT[status] : 0
  const isReadonly = status === 'submitted' || status === 'feedback_sent' || status === 'completed'
  const prevId = lesson.prev_lesson_id
  const nextId = lesson.next_lesson_id

  const navBtnStyle = (enabled: boolean) => ({
    padding: '0.375rem 0.875rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: enabled ? 'var(--accent)' : 'var(--muted)',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.5,
  })

  return (
    <motion.div variants={fadeInDown} initial="hidden" animate="visible" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.25rem', padding: '0.25rem', lineHeight: 1 }}
          aria-label="عودة"
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{lesson.book_title_en} · {lesson.book_level}</p>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{lesson.title_ar}</h1>
        </div>
        {status && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: 9999, background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}>
            {STATUS_LABEL[status]}
          </span>
        )}
        {!isReadonly && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            style={{ padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ مسودة'}
          </button>
        )}
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: 'var(--accent)', borderRadius: 9999 }}
        />
      </div>
      {(prevId || nextId) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            disabled={!prevId}
            onClick={() => prevId && navigate(`/student/book/${prevId}`)}
            style={navBtnStyle(!!prevId)}
          >
            → الدرس السابق
          </button>
          <button
            type="button"
            disabled={!nextId}
            onClick={() => nextId && navigate(`/student/book/${nextId}`)}
            style={navBtnStyle(!!nextId)}
          >
            الدرس التالي ←
          </button>
        </div>
      )}
    </motion.div>
  )
}
