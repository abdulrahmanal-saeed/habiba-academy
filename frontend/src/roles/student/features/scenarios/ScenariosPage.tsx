import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { stagger, fadeInUp } from '@/design-system/animations'
import { getScenarios } from './api'
import { ScenarioCard } from './components/ScenarioCard'

export const ScenariosPage: FC = () => {
  const navigate = useNavigate()
  const { data: scenarios, isLoading, error } = useQuery({
    queryKey: ['student-scenarios'],
    queryFn: getScenarios,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>
          Failed to load scenarios. Please try again.
        </p>
      </div>
    )
  }

  const today           = new Date().toISOString().slice(0, 10)
  const todayScenarios  = (scenarios ?? []).filter((s) => s.sc_date === today)
  const otherScenarios  = (scenarios ?? []).filter((s) => s.sc_date !== today)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Mic size={20} color="var(--accent)" />
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--fg)' }}>
              Speaking Scenarios
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Practice Arabic speaking with real-life scenarios
          </p>
        </motion.div>

        {scenarios?.length === 0 && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center py-16">
            <Mic size={40} color="var(--muted)" className="mx-auto mb-3" />
            <p className="font-semibold" style={{ color: 'var(--fg)' }}>No scenarios yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Your teacher hasn't assigned any scenarios yet.
            </p>
          </motion.div>
        )}

        {todayScenarios.length > 0 && (
          <motion.section variants={stagger} initial="hidden" animate="visible" className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--accent)' }}>
              Today
            </h2>
            <div className="flex flex-col gap-3">
              {todayScenarios.map((sc) => (
                <ScenarioCard
                  key={sc.id}
                  scenario={sc}
                  onClick={() => navigate(`/student/scenarios/${sc.id}`)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {otherScenarios.length > 0 && (
          <motion.section variants={stagger} initial="hidden" animate="visible">
            {todayScenarios.length > 0 && (
              <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
                Previous
              </h2>
            )}
            <div className="flex flex-col gap-3">
              {otherScenarios.map((sc) => (
                <ScenarioCard
                  key={sc.id}
                  scenario={sc}
                  onClick={() => navigate(`/student/scenarios/${sc.id}`)}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
