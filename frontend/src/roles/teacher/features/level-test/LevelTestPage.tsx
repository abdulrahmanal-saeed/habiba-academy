import { useState, type FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/design-system/animations'
import { levelTestApi } from './api'
import { AttemptList } from './components/AttemptList'
import { GradeAttemptDrawer } from './components/GradeAttemptDrawer'
import { BlockEditor } from './components/BlockEditor'
import { PromptEditor } from './components/PromptEditor'
import type { LevelTestAttempt, LevelTestReviewStatus } from './types'

type PageTab = 'attempts' | 'bank' | 'prompts'

export const LevelTestPage: FC = () => {
  const [tab, setTab]         = useState<PageTab>('attempts')
  const [filter, setFilter]   = useState<LevelTestReviewStatus | 'all'>('all')
  const [grading, setGrading] = useState<LevelTestAttempt | null>(null)

  const attemptsQuery = useQuery({
    queryKey: ['leveltest-attempts', filter],
    queryFn:  () => levelTestApi.getAttempts(filter),
    enabled:  tab === 'attempts',
  })

  const bankQuery = useQuery({
    queryKey: ['leveltest-bank'],
    queryFn:  () => levelTestApi.getBankData(),
    enabled:  tab === 'bank',
  })

  const attempts    = attemptsQuery.data?.attempts     ?? []
  const pendingCount = attemptsQuery.data?.pending_count ?? 0
  const blocks      = bankQuery.data?.blocks            ?? []

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-5 p-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Level Test</h1>
        {tab === 'attempts' && pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Page tabs */}
      <div className="flex gap-1.5 border-b border-[var(--border)] pb-0">
        {([
          { key: 'attempts', label: 'Attempts' },
          { key: 'bank',     label: 'Question Bank' },
          { key: 'prompts',  label: 'Prompts' },
        ] as { key: PageTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-medium transition ${
              tab === key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Attempts tab */}
      {tab === 'attempts' && (
        <AttemptList
          attempts={attempts}
          pendingCount={pendingCount}
          isLoading={attemptsQuery.isLoading}
          filter={filter}
          onFilterChange={setFilter}
          onGrade={setGrading}
        />
      )}

      {/* Question Bank tab */}
      {tab === 'bank' && (
        <div className="space-y-6">
          {bankQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-[var(--text-3)]">Loading…</div>
          ) : (
            <>
              <BlockEditor blocks={blocks} section="listening" />
              <BlockEditor blocks={blocks} section="reading" />
            </>
          )}
        </div>
      )}

      {/* Prompts tab */}
      {tab === 'prompts' && <PromptEditor />}

      <GradeAttemptDrawer
        attempt={grading}
        onClose={() => setGrading(null)}
      />
    </motion.div>
  )
}
