import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import type { ScenarioItem } from '../types'
import { ScenarioRow } from './ScenarioRow'

interface Props {
  scenarios: ScenarioItem[]
  onNew: () => void
  onDelete: (id: number) => void
  isLoading: boolean
}

export const ScenarioList: FC<Props> = ({ scenarios, onNew, onDelete, isLoading }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-[var(--text-1)]">
        Scenarios
        {scenarios.length > 0 && (
          <span className="ms-2 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-2)]">
            {scenarios.length}
          </span>
        )}
      </h3>
      <motion.button
        whileHover={{ y: -1 }}
        onClick={onNew}
        className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
      >
        <span>+</span> New Scenario
      </motion.button>
    </div>

    {isLoading && (
      <div className="py-8 text-center text-sm text-[var(--text-3)]">Loading…</div>
    )}

    {!isLoading && scenarios.length === 0 && (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-3)]">
        No scenarios yet. Create one to get started.
      </div>
    )}

    <AnimatePresence initial={false}>
      {scenarios.map((s) => (
        <ScenarioRow key={s.id} scenario={s} onDelete={onDelete} />
      ))}
    </AnimatePresence>
  </div>
)
