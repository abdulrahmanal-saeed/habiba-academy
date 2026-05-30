import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/core/auth'
import { Spinner } from '@/design-system/components'
import { getHomework, submitHomework } from './api'
import { useHomeworkStore } from './homework.store'
import { StepIndicator }    from './components/StepIndicator'
import { ResumeBanner }     from './components/ResumeBanner'
import { AlreadySubmitted } from './components/AlreadySubmitted'
import { ListeningStep }    from './components/ListeningStep'
import { ReadingStep }      from './components/ReadingStep'
import { MCQStep }          from './components/MCQStep'
import { WritingStep }      from './components/WritingStep'
import { SpeakingStep }     from './components/SpeakingStep'
import { SubmitStep }       from './components/SubmitStep'

export const HomeworkPage: FC = () => {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const hwId       = Number(id ?? 0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError,  setSubmitError]  = useState<string | null>(null)

  const { data: hw, isLoading, isError } = useQuery({
    queryKey: ['student', 'homework', hwId],
    queryFn:  () => getHomework(hwId),
    enabled:  hwId > 0,
    retry:    false,
  })

  const currentStep      = useHomeworkStore((s) => s.currentStep)
  const progressRestored = useHomeworkStore((s) => s.progressRestored)
  const mcqAnswers       = useHomeworkStore((s) => s.mcqAnswers)
  const writingAnswers   = useHomeworkStore((s) => s.writingAnswers)
  const speakingBlobs    = useHomeworkStore((s) => s.speakingBlobs)
  const setStep          = useHomeworkStore((s) => s.setStep)

  useEffect(() => {
    if (hwId <= 0) navigate('/student')
  }, [hwId, navigate])

  useEffect(() => {
    if (isError) navigate('/student')
  }, [isError, navigate])

  // Load localStorage progress once hw arrives, reset on unmount
  useEffect(() => {
    if (!hw || !user) return
    useHomeworkStore.getState().loadProgress(user.id, hw.id)
    return () => useHomeworkStore.getState().reset()
  }, [hw?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || (!hw && !isError)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!hw) return null
  if (hw.isSubmitted) return <AlreadySubmitted homeworkId={hwId} />

  const steps   = hw.steps
  const isFirst = currentStep === 0
  const isLast  = currentStep === steps.length - 1
  const step    = steps[currentStep]

  const go = (dir: 1 | -1) => {
    const next = currentStep + dir
    if (next < 0 || next >= steps.length) return
    setStep(next)
    if (user) useHomeworkStore.getState().saveProgress(user.id, hwId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!user) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await submitHomework(hwId, mcqAnswers, writingAnswers, speakingBlobs)
      useHomeworkStore.getState().clearProgress(user.id, hwId)
      try { localStorage.setItem('book_pending_popup', 'homework') } catch { /* silent */ }
      navigate(`/student/homework/${hwId}/result`)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'حدث خطأ، حاولي مرة أخرى')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-4 pb-16" dir="rtl">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{hw.title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{hw.hwDate}</p>
      </div>

      <StepIndicator steps={steps} currentStep={currentStep} stepDurations={hw.stepDurations} />

      {progressRestored && <ResumeBanner />}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
        >
          {step === 'listening' && <ListeningStep mediaUrl={hw.mediaUrl!} instructions={hw.mediaInstructions} />}
          {step === 'reading'   && <ReadingStep text={hw.readingText!} />}
          {step === 'mcq'       && <MCQStep questions={hw.mcqQuestions} homeworkId={hwId} studentId={user?.id ?? 0} />}
          {step === 'writing'   && <WritingStep questions={hw.writingQuestions} homeworkId={hwId} studentId={user?.id ?? 0} />}
          {step === 'speaking'  && <SpeakingStep questions={hw.speakingQuestions} />}
          {step === 'submit'    && (
            <SubmitStep
              homework={hw}
              mcqAnswers={mcqAnswers}
              writingAnswers={writingAnswers}
              speakingBlobs={speakingBlobs}
              onSubmit={() => { void handleSubmit() }}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-2">
        <button
          onClick={() => go(-1)}
          disabled={isFirst}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-0"
          style={{ background: 'var(--surface2)', color: 'var(--fg)' }}
        >
          <ChevronRight size={16} /> السابق
        </button>
        {!isLast && (
          <button
            onClick={() => go(1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            التالي <ChevronLeft size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
