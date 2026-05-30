import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { ScenarioItem } from '../types'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'bg-[var(--surface-2)] text-[var(--text-2)]' },
  published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
  scheduled: { label: 'Scheduled', cls: 'bg-amber-100 text-amber-700' },
  closed:    { label: 'Closed',    cls: 'bg-[var(--surface-3)] text-[var(--text-3)]' },
}

interface Props {
  scenario: ScenarioItem
  onDelete: (id: number) => void
}

export const ScenarioRow: FC<Props> = ({ scenario, onDelete }) => {
  const badge = STATUS_LABELS[scenario.effective_status] ?? STATUS_LABELS.draft

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--text-1)]">{scenario.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="mb-2 text-sm text-[var(--text-2)]">
          {scenario.sc_date}
          {scenario.recording_count > 0 && (
            <span className="ms-3 text-[var(--accent)]">
              {scenario.recording_count} recording{scenario.recording_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {scenario.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scenario.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(scenario.id)}
        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50"
        aria-label="Delete scenario"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  )
}
