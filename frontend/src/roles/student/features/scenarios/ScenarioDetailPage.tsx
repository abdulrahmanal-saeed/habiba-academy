import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { stagger, fadeInUp } from '@/design-system/animations'
import { getScenarioDetail, submitScenario } from './api'
import { RecordingSection } from './components/RecordingSection'
import { PreviousRecordings } from './components/PreviousRecordings'
import { ModelAnswerAccordion } from './components/ModelAnswerAccordion'

export const ScenarioDetailPage: FC = () => {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const scenarioId   = Number(id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-scenario', scenarioId],
    queryFn: () => getScenarioDetail(scenarioId),
    enabled: !!scenarioId,
  })

  async function handleSubmit(audio: Blob, takeNo: number): Promise<void> {
    await submitScenario(scenarioId, takeNo, audio)
  }

  function handleSubmitted(): void {
    void queryClient.invalidateQueries({ queryKey: ['student-scenario', scenarioId] })
    void queryClient.invalidateQueries({ queryKey: ['student-scenarios'] })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-4 text-center"
           style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>Scenario not found.</p>
        <button
          type="button"
          onClick={() => navigate('/student/scenarios')}
          className="text-sm underline"
          style={{ color: 'var(--accent)' }}
        >
          Back to scenarios
        </button>
      </div>
    )
  }

  const { scenario, recordings, next_take } = data
  const showModelAnswer = !!scenario.model_answer && recordings.length > 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/student/scenarios')}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            aria-label="Back to scenarios"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="font-extrabold text-lg leading-snug truncate" style={{ color: 'var(--fg)' }}>
              {scenario.title}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {new Date(scenario.sc_date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
          {(scenario.situation || scenario.prompt || scenario.keywords.length > 0) && (
            <motion.div
              className="rounded-xl p-5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            >
              {scenario.situation && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
                    📍 Context
                  </p>
                  <p className="text-sm" style={{ color: 'var(--fg)' }}>{scenario.situation}</p>
                </div>
              )}
              {scenario.prompt && (
                <div className={scenario.keywords.length > 0 ? 'mb-4' : ''}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
                    🎯 Your Mission
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{scenario.prompt}</p>
                </div>
              )}
              {scenario.keywords.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                    🔑 Keywords
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scenario.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <RecordingSection
            key={next_take}
            scenarioId={scenarioId}
            timeLimitSeconds={scenario.time_limit_seconds}
            nextTake={next_take}
            onSubmit={handleSubmit}
            onSubmitted={handleSubmitted}
          />

          {recordings.length > 0 && (
            <PreviousRecordings recordings={recordings} scenarioId={scenarioId} />
          )}

          {showModelAnswer && (
            <ModelAnswerAccordion modelAnswer={scenario.model_answer!} />
          )}
        </motion.div>
      </div>
    </div>
  )
}
