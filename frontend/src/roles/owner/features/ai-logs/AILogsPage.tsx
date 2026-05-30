import { useState, type FC } from 'react'
import { motion } from 'framer-motion'
import { useAILogs } from './hooks/useAILogs'
import { AIHealthStrip } from './components/AIHealthStrip'
import { AILogsFilter } from './components/AILogsFilter'
import { AILogRow } from './components/AILogRow'
import { stagger } from './animations'

export const AILogsPage: FC = () => {
  const [feature, setFeature] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, error } = useAILogs(feature || undefined, status || undefined)

  return (
    <div className="p-3 p-md-4">
      <div className="fw-bold fs-4 mb-1">AI Logs</div>
      <div className="small mb-4" style={{ color: 'var(--muted)' }}>
        Saved prompts, responses, usage, and errors · last 100
      </div>

      {data?.health && <AIHealthStrip health={data.health} />}

      <AILogsFilter
        features={data?.features ?? []}
        feature={feature}
        status={status}
        onFeatureChange={setFeature}
        onStatusChange={setStatus}
      />

      {isLoading && (
        <div className="small py-4 text-center" style={{ color: 'var(--muted)' }}>Loading…</div>
      )}

      {error && (
        <div className="small py-2" style={{ color: 'var(--danger)' }}>Failed to load logs.</div>
      )}

      {data && (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="d-grid gap-2">
          {data.logs.length === 0 ? (
            <div className="small text-center py-4" style={{ color: 'var(--muted)' }}>No logs found.</div>
          ) : (
            data.logs.map((entry) => <AILogRow key={entry.id} entry={entry} />)
          )}
        </motion.div>
      )}
    </div>
  )
}
