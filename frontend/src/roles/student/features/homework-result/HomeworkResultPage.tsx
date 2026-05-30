import type { FC } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { stagger } from '@/design-system/animations'
import { getHomeworkResult } from './api'
import { ResultHeader }      from './components/ResultHeader'
import { MCQResultCard }     from './components/MCQResultCard'
import { WritingResultCard } from './components/WritingResultCard'
import { SpeakingResultCard } from './components/SpeakingResultCard'
import { ReadingAccordion }  from './components/ReadingAccordion'
import { BookPopupModal }    from './components/BookPopupModal'

export const HomeworkResultPage: FC = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hwId     = Number(id ?? 0)

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['student', 'homework-result', hwId],
    queryFn:  () => getHomeworkResult(hwId),
    enabled:  hwId > 0,
    retry:    false,
  })

  if (hwId <= 0 || isError) {
    navigate('/student')
    return null
  }

  if (isLoading || !result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  const hasMcq      = result.mcqResults.length > 0
  const hasWriting   = result.writingResults.length > 0
  const hasSpeaking  = result.speakingResults.length > 0
  const hasReading   = Boolean(result.readingText)

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-16" dir="rtl">
      {/* Back link */}
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-sm mb-4"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowRight size={15} />
        الرئيسية
      </Link>

      {/* Page title */}
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>
          {result.title}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {result.hwDate}
        </p>
      </div>

      {/* Card stack */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        <ResultHeader
          isSubmitted={result.isSubmitted}
          submittedAt={result.submittedAt}
          mcqScore={result.mcqScore}
          mcqTotal={result.mcqTotal}
          teacherNote={result.teacherNote}
        />

        {hasMcq && (
          <MCQResultCard
            results={result.mcqResults}
            score={result.mcqScore}
            total={result.mcqTotal}
          />
        )}

        {hasWriting && <WritingResultCard results={result.writingResults} />}

        {hasSpeaking && <SpeakingResultCard results={result.speakingResults} />}

        {hasReading && <ReadingAccordion text={result.readingText!} />}
      </motion.div>

      {/* Book popup — mounts silently, shows only if conditions met */}
      {result.bookPopup && <BookPopupModal config={result.bookPopup} />}
    </div>
  )
}
