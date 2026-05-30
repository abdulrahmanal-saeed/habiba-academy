import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useBookAnswers } from '@/shared/interactive-book'
import type { BookLessonData, LessonStatus, ParsedAnswers } from '@/shared/interactive-book'
import { SectionRenderer } from '@/shared/interactive-book/SectionRenderer'
import { contentToSections } from '@/shared/interactive-book/sections/contentToSections'
import { bookApi } from './api'
import { LessonHeader } from './components/LessonHeader'

// ── LessonContent ─────────────────────────────────────────────────────────────

interface LessonContentProps {
  data: BookLessonData
  initialAnswers: ParsedAnswers
}

const LessonContent: FC<LessonContentProps> = ({ data, initialAnswers }) => {
  const { lesson, content } = data
  const navigate = useNavigate()
  const answers = useBookAnswers(initialAnswers)
  const [status, setStatus] = useState<LessonStatus | null>(data.submission?.status ?? null)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const isReadonly = status === 'submitted' || status === 'feedback_sent' || status === 'completed'
  const sections = contentToSections(content)

  const handleSaveDraft = useCallback(async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      const fd = answers.getFormData(lesson.id)
      await bookApi.saveDraft(fd)
      setStatus('draft')
      setSuccessMsg('تم حفظ المسودة')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('تعذّر حفظ المسودة. حاول مجدداً.')
    } finally {
      setSaving(false)
    }
  }, [answers, lesson.id])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setErrorMsg('')
    try {
      const fd = answers.getFormData(lesson.id)
      await bookApi.submitLesson(fd)
      setStatus('submitted')
      setSuccessMsg('تم تقديم الدرس بنجاح!')
    } catch {
      setErrorMsg('تعذّر تقديم الدرس. حاول مجدداً.')
    } finally {
      setSubmitting(false)
    }
  }, [answers, lesson.id])

  const handleWeakWord = useCallback((word: string) => {
    bookApi.addWeakWord(word)
  }, [])

  const handleAudioPlay = useCallback((key: string) => {
    bookApi.trackAudio(lesson.id, key)
  }, [lesson.id])

  // Self-check items
  const selfCheckItems = content.self_check
    ? Object.entries(content.self_check)
    : []

  return (
    <div>
      <LessonHeader lesson={lesson} status={status} onSaveDraft={() => void handleSaveDraft()} saving={saving} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {sections.map((section, i) => (
          <SectionRenderer
            key={`${section.type}-${i}`}
            section={section}
            lessonId={lesson.id}
            answers={answers}
            readonly={isReadonly}
            onWeakWord={handleWeakWord}
            onAudioPlay={handleAudioPlay}
          />
        ))}

        {/* Self-check */}
        {selfCheckItems.length > 0 && !isReadonly && (
          <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem' }}>التقييم الذاتي</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
              أكمل {content.self_check_min ?? selfCheckItems.length} على الأقل للتقديم
            </p>
            {selfCheckItems.map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={answers.selfCheck.includes(key)}
                  onChange={() => answers.toggleSelfCheck(key)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                />
                <span style={{ fontSize: '0.9375rem', color: 'var(--ink)', direction: 'rtl' }}>{label}</span>
              </label>
            ))}
          </motion.section>
        )}

        {/* Messages */}
        {errorMsg && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.75rem', textAlign: 'center' }}>{errorMsg}</p>}
        {successMsg && <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginBottom: '0.75rem', textAlign: 'center' }}>{successMsg}</p>}

        {/* Submit */}
        {!isReadonly && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', paddingBottom: '2rem' }}>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || saving}
              style={{ padding: '0.75rem 2rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'جاري التقديم...' : (content.submit_label ?? 'تقديم الدرس')}
            </button>
          </motion.div>
        )}

        {isReadonly && status === 'submitted' && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9375rem', padding: '1rem' }}>
            تم تقديم الدرس — في انتظار مراجعة المعلمة.
          </p>
        )}

        {(status === 'feedback_sent' || status === 'completed') && data.submission?.id && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" style={{ display: 'flex', justifyContent: 'center', paddingBottom: '2rem' }}>
            <button
              type="button"
              onClick={() => navigate(`/student/book/feedback/${data.submission?.id}`)}
              style={{ padding: '0.75rem 2rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
            >
              عرض التقييم
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── LessonPage (data shell) ───────────────────────────────────────────────────

export const LessonPage: FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>()
  const id = Number(lessonId)
  const [data, setData] = useState<BookLessonData | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(!id ? 'معرّف الدرس غير صحيح.' : '')

  useEffect(() => {
    if (!id) return
    bookApi.getLesson(id)
      .then(setData)
      .catch(() => setError('تعذّر تحميل الدرس. حاول مجدداً.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size="lg" /></div>
  if (error || !data) return <p style={{ color: 'var(--danger)', padding: '2rem', textAlign: 'center' }}>{error || 'الدرس غير موجود.'}</p>

  return <LessonContent data={data} initialAnswers={data.answers} />
}
