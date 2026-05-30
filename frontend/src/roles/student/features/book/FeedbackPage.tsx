import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fadeInUp, stagger, cardVariant } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import type { FeedbackPageData } from '@/shared/interactive-book'
import { bookApi } from './api'

// ── Score card ────────────────────────────────────────────────────────────────

const ScoreCard: FC<{ label: string; value: string | number | null; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{ background: 'var(--card)', border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '0.875rem', textAlign: 'center' }}>
    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{label}</p>
    <p style={{ fontSize: '1.375rem', fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--ink)', margin: 0 }}>
      {value ?? '—'}
    </p>
  </div>
)

// ── FeedbackContent ───────────────────────────────────────────────────────────

const FeedbackContent: FC<{ data: FeedbackPageData }> = ({ data }) => {
  const navigate = useNavigate()
  const { submission, answers, feedback, speaking } = data

  const writingAnswer = answers.writing_task?.answer ?? ''
  const writingTasks = answers.writing_tasks ?? {}
  const hasWriting = writingAnswer || Object.keys(writingTasks).length > 0
  const speakingUrl = answers.speaking_task?.audio_url ?? speaking?.audio_url ?? ''

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{ marginBottom: '1.5rem' }}>
        <button type="button" onClick={() => navigate('/student/book')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem', padding: 0 }}>← العودة للكتب</button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.25rem' }}>
          {submission.lesson_title} — النتيجة
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{submission.book_title}</p>
      </motion.div>

      {/* Score summary */}
      <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <motion.div variants={cardVariant}><ScoreCard label="الدرجة التلقائية" value={`${submission.auto_score}%`} accent /></motion.div>
        <motion.div variants={cardVariant}><ScoreCard label="درجة المعلمة" value={submission.teacher_score !== null ? `${submission.teacher_score}%` : null} /></motion.div>
        <motion.div variants={cardVariant}><ScoreCard label="الحالة" value={submission.status} /></motion.div>
      </motion.div>

      {/* Final feedback */}
      {feedback.general && (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.375rem' }}>تعليق المعلمة</p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', whiteSpace: 'pre-line', margin: 0 }}>{feedback.general}</p>
        </motion.div>
      )}

      {/* Writing feedback */}
      {hasWriting && (
        <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>التعبير الكتابي</h2>
          {writingAnswer && (
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '0.75rem', direction: 'rtl', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--ink)' }}>{writingAnswer}</div>
          )}
          {Object.entries(writingTasks).map(([key, val]) => (
            <div key={key} style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{key}</p>
              <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', direction: 'rtl', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--ink)' }}>{val.answer}</div>
            </div>
          ))}
          {feedback.writing && (
            <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem' }}>تصحيح الكتابة</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', whiteSpace: 'pre-line', margin: 0 }}>{feedback.writing}</p>
            </div>
          )}
          {feedback.correction && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.25rem' }}>ملاحظات التصحيح</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', whiteSpace: 'pre-line', margin: 0 }}>{feedback.correction}</p>
            </div>
          )}
        </motion.section>
      )}

      {/* Speaking feedback */}
      {speakingUrl && (
        <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>التعبير الشفهي</h2>
          <audio controls src={speakingUrl} style={{ width: '100%', marginBottom: '0.75rem' }} />
          {speaking?.teacher_feedback && <p style={{ fontSize: '0.875rem', color: 'var(--ink)', marginBottom: '0.5rem' }}><strong>التقييم الشفهي:</strong> {speaking.teacher_feedback}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.8125rem' }}>
            {speaking?.pronunciation_note && <div><p style={{ fontWeight: 700, color: 'var(--muted)', margin: '0 0 0.125rem' }}>النطق</p><p style={{ margin: 0 }}>{speaking.pronunciation_note}</p></div>}
            {speaking?.fluency_note && <div><p style={{ fontWeight: 700, color: 'var(--muted)', margin: '0 0 0.125rem' }}>الطلاقة</p><p style={{ margin: 0 }}>{speaking.fluency_note}</p></div>}
            {speaking?.correction_note && <div><p style={{ fontWeight: 700, color: 'var(--muted)', margin: '0 0 0.125rem' }}>التصحيح</p><p style={{ margin: 0 }}>{speaking.correction_note}</p></div>}
          </div>
        </motion.section>
      )}

      {/* Actions */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button type="button" onClick={() => navigate(`/student/book/${submission.lesson_id}`)} style={{ padding: '0.625rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>
          التدرب مرة أخرى
        </button>
        <button type="button" onClick={() => navigate('/student/book')} style={{ padding: '0.625rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>
          العودة للكتب
        </button>
      </motion.div>
    </div>
  )
}

// ── FeedbackPage (data shell) ─────────────────────────────────────────────────

export const FeedbackPage: FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>()
  const id = Number(submissionId)
  const [data, setData] = useState<FeedbackPageData | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(!id ? 'معرّف التقديم غير صحيح.' : '')

  useEffect(() => {
    if (!id) return
    bookApi.getFeedback(id)
      .then(setData)
      .catch(() => setError('تعذّر تحميل النتيجة. حاول مجدداً.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size="lg" /></div>
  if (error || !data) return <p style={{ color: 'var(--danger)', padding: '2rem', textAlign: 'center' }}>{error || 'النتيجة غير موجودة.'}</p>

  return <FeedbackContent data={data} />
}
