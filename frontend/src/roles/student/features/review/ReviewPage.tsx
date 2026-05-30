import { useState, useEffect, useCallback } from 'react'
import type { FC, ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { stagger } from '@/design-system/animations'
import { useAuth } from '@/core/auth/useAuth'
import { getReview, submitReview } from './api'
import { useReviewStore } from './review.store'
import type { ReviewStore } from './review.store'
import { MCQSectionCard }      from './components/MCQSectionCard'
import { MatchingSectionCard }  from './components/MatchingSectionCard'
import { FillBlankSectionCard } from './components/FillBlankSectionCard'
import { WritingSectionCard }   from './components/WritingSectionCard'
import { SpeakingSectionCard }  from './components/SpeakingSectionCard'
import { ScenarioSectionCard }  from './components/ScenarioSectionCard'
import type { ReviewSection } from './types'

export const ReviewPage: FC = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const rvId     = Number(id ?? 0)

  const store = useReviewStore()
  const { mcqAnswers, matchingAnswers, fillAnswers, writingAnswers } = store

  const [speakingBlobs, setSpeakingBlobs] = useState<Record<string, Blob>>({})
  const [scenarioBlobs, setScenarioBlobs] = useState<Record<string, Blob>>({})
  const [missingIds,    setMissingIds]    = useState<Set<string>>(new Set())
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  const { data: review, isLoading, isError } = useQuery({
    queryKey: ['student', 'review', rvId],
    queryFn:  () => getReview(rvId),
    enabled:  rvId > 0,
    retry:    false,
  })

  useEffect(() => {
    if (!review || !user) return
    useReviewStore.getState().loadProgress(user.id, review.id)
    return () => useReviewStore.getState().reset()
  }, [review?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!review || !user) return
    useReviewStore.getState().saveProgress(user.id, review.id)
  }, [mcqAnswers, matchingAnswers, fillAnswers, writingAnswers, review?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addSpeakingBlob = useCallback((qid: string, blob: Blob) => {
    setSpeakingBlobs((prev) => ({ ...prev, [qid]: blob }))
  }, [])
  const addScenarioBlob = useCallback((qid: string, blob: Blob) => {
    setScenarioBlobs((prev) => ({ ...prev, [qid]: blob }))
  }, [])

  if (rvId <= 0 || isError) { navigate('/student'); return null }
  if (isLoading || !review) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!review) return

    const missing = new Set<string>()
    for (const sec of review.sections) {
      if (sec.section_id === 'speaking') {
        for (const q of sec.questions) {
          if (!speakingBlobs[q.id]) missing.add(q.id)
        }
      }
      if (sec.section_id === 'scenario') {
        for (const sc of sec.scenarios) {
          if (!scenarioBlobs[sc.id]) missing.add(sc.id)
        }
      }
    }
    if (missing.size > 0) {
      setMissingIds(missing)
      setError('سجّل جميع الإجابات الصوتية قبل الإرسال')
      return
    }
    setMissingIds(new Set())
    setError(null)
    setSubmitting(true)
    try {
      await submitReview(review.id, mcqAnswers, matchingAnswers, fillAnswers, writingAnswers, speakingBlobs, scenarioBlobs)
      useReviewStore.getState().clearProgress(user!.id, review.id)
      navigate(`/student/review/${review.id}/result`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل الإرسال'
      if (msg.includes('already submitted')) {
        navigate(`/student/review/${review.id}/result`)
      } else {
        setError(msg)
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-16" dir="rtl">
      <Link to="/student" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted)' }}>
        <ArrowRight size={15} />الرئيسية
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{review.title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{review.reviewDate}</p>
      </div>
      <div className="rounded-[var(--radius-md)] px-4 py-3 mb-4 text-sm" style={{ background: 'var(--accent-soft)', color: 'var(--fg)' }}>
        ستُصحَّح الأجزاء الآلية فور الإرسال، أما النتيجة النهائية فتظهر بعد مراجعة المعلم.
      </div>
      <form onSubmit={(e) => { void handleSubmit(e) }}>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
          {review.sections.map((section) => renderSection(section, store, speakingBlobs, scenarioBlobs, missingIds, addSpeakingBlob, addScenarioBlob))}
        </motion.div>
        {error && <p className="mt-4 text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full py-3 rounded-[var(--radius-md)] text-sm font-bold transition-opacity"
          style={{ background: 'var(--accent)', color: 'var(--bg)', opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? 'جارٍ الإرسال...' : 'إرسال المراجعة'}
        </button>
      </form>
    </div>
  )
}

function renderSection(
  section: ReviewSection,
  store: ReviewStore,
  speakingBlobs: Record<string, Blob>,
  scenarioBlobs: Record<string, Blob>,
  missingIds: Set<string>,
  addSpeaking: (qid: string, blob: Blob) => void,
  addScenario: (qid: string, blob: Blob) => void,
): ReactNode {
  switch (section.section_id) {
    case 'mcq':
      return <MCQSectionCard key={section.section_id + (section.title ?? '')} section={section} answers={store.mcqAnswers} onAnswer={store.setMcqAnswer} />
    case 'matching':
      return <MatchingSectionCard key={section.section_id + (section.title ?? '')} section={section} answers={store.matchingAnswers} onAnswer={store.setMatchingAnswer} />
    case 'fill_the_blank':
      return <FillBlankSectionCard key={section.section_id + (section.title ?? '')} section={section} answers={store.fillAnswers} onAnswer={store.setFillAnswer} />
    case 'writing':
      return <WritingSectionCard key={section.section_id + (section.title ?? '')} section={section} answers={store.writingAnswers} onAnswer={store.setWritingAnswer} />
    case 'speaking':
      return <SpeakingSectionCard key={section.section_id + (section.title ?? '')} section={section} blobs={speakingBlobs} missingIds={missingIds} onBlob={addSpeaking} />
    case 'scenario':
      return <ScenarioSectionCard key={section.section_id + (section.title ?? '')} section={section} blobs={scenarioBlobs} missingIds={missingIds} onBlob={addScenario} />
    default:
      return null
  }
}
