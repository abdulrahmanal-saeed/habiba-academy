import type { FC, ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { stagger } from '@/design-system/animations'
import { getReviewResult } from './api'
import { ReviewResultHeader }    from './components/ReviewResultHeader'
import { MCQResultSection }      from './components/MCQResultSection'
import { MatchingResultSection }  from './components/MatchingResultSection'
import { FillBlankResultSection } from './components/FillBlankResultSection'
import { ManualResultSection }    from './components/ManualResultSection'
import type { ReviewResult, ReviewSection, AnswersMap, AutoBreakdownMap } from './types'

export const ReviewResultPage: FC = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const rvId     = Number(id ?? 0)

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['student', 'review-result', rvId],
    queryFn:  () => getReviewResult(rvId),
    enabled:  rvId > 0,
    retry:    false,
  })

  if (rvId <= 0 || isError) { navigate('/student'); return null }
  if (isLoading || !result) {
    return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>
  }

  const isReviewed = result.reviewStatus === 'reviewed'
  const answers    = result.answers     ?? { mcq: {}, matching: {}, fill_the_blank: {}, writing: {}, speaking: {}, scenario: {} }
  const breakdown  = result.autoBreakdown ?? {}

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-16" dir="rtl">
      <Link to="/student" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted)' }}>
        <ArrowRight size={15} />الرئيسية
      </Link>
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{result.title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{result.reviewDate}</p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        <ReviewResultHeader
          reviewType={result.reviewType}
          submittedAt={result.submittedAt}
          reviewStatus={result.reviewStatus}
          effectiveAutoScore={result.effectiveAutoScore}
          manualScore={result.manualScore}
          totalScore={result.totalScore}
          totalPoints={result.totalPoints}
          teacherNote={result.teacherNote}
        />

        {isReviewed && result.schema.sections.map((section, i) =>
          renderResultSection(section, i, result, answers, breakdown),
        )}
      </motion.div>
    </div>
  )
}

function renderResultSection(
  section: ReviewSection,
  index: number,
  result: ReviewResult,
  answers: AnswersMap,
  breakdown: AutoBreakdownMap,
): ReactNode {
  const key    = `${section.section_id}-${index}`
  const ms     = result.manualScores
  const overrides = result.sectionOverrides

  switch (section.section_id) {
    case 'mcq':
      return <MCQResultSection key={key} section={section} answers={answers} autoBreakdown={breakdown} manualScores={ms} sectionOverrides={overrides} />
    case 'matching':
      return <MatchingResultSection key={key} section={section} answers={answers} autoBreakdown={breakdown} />
    case 'fill_the_blank':
      return <FillBlankResultSection key={key} section={section} answers={answers} autoBreakdown={breakdown} manualScores={ms} sectionOverrides={overrides} />
    case 'writing':
    case 'speaking':
    case 'scenario':
      return <ManualResultSection key={key} section={section} answers={answers} manualScores={ms} />
    case 'emirati_dialect':
      return <EmiratialDialectResult key={key} section={section} answers={answers} />
    default:
      return null
  }
}

interface EmiratialDialectResultProps {
  section: Extract<ReviewSection, { section_id: 'emirati_dialect' }>
  answers: AnswersMap
}

const EmiratialDialectResult: FC<EmiratialDialectResultProps> = ({ section, answers }) => {
  const dialectAnswers = answers.diagnostic?.emirati_dialect ?? {}
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-3" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'اللهجة الإماراتية'}
      </h2>
      <div className="flex flex-col gap-3">
        {section.questions.map((q, i) => {
          const ans     = dialectAnswers[q.id] ?? { known: '', meaning: '' }
          const wordText = q.word ?? q.question ?? ''
          return (
            <div
              key={q.id}
              className="rounded-[var(--radius-md)] p-3"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                {i + 1}. {wordText}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                هل عرفتها: <strong>{ans.known || '—'}</strong>
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                معناها عندك: <strong>{ans.meaning || '—'}</strong>
              </p>
              {q.correct_meaning && (
                <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>
                  المعنى الصحيح: <strong>{q.correct_meaning}</strong>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

