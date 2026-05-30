import { useState, type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AILogEntry } from '../types'
import { rowVariant, expandVariant } from '../animations'

const STATUS_COLOR: Record<string, string> = {
  success: 'var(--accent)',
  failed:  'var(--danger)',
  cached:  'var(--warning)',
}

interface Props {
  entry: AILogEntry
}

export const AILogRow: FC<Props> = ({ entry }) => {
  const [open, setOpen] = useState(false)
  const badgeColor = STATUS_COLOR[entry.status] ?? 'var(--muted)'

  return (
    <motion.div
      variants={rowVariant}
      style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'block', width: '100%', textAlign: 'start',
          padding: '0.75rem 1rem', background: 'var(--surface)',
          border: 'none', cursor: 'pointer',
        }}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="small fw-semibold" style={{ color: 'var(--muted)', minWidth: 30 }}>
            #{entry.id}
          </span>
          <span
            className="badge"
            style={{ background: badgeColor, color: '#fff', fontSize: '0.65rem' }}
          >
            {entry.status}
          </span>
          <span className="small fw-semibold">{entry.feature_key}</span>
          <span className="small" style={{ color: 'var(--muted)' }}>
            {entry.full_name ?? (entry.student_id ? `#${entry.student_id}` : 'System')}
          </span>
          <span className="small ms-auto" style={{ color: 'var(--muted)' }}>
            {entry.cost_tokens_input}↑ {entry.cost_tokens_output}↓
          </span>
          {parseFloat(entry.estimated_cost_usd) > 0 && (
            <span className="small" style={{ color: 'var(--muted)' }}>
              ${parseFloat(entry.estimated_cost_usd).toFixed(5)}
            </span>
          )}
          <span className="small" style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
            {entry.created_at?.slice(0, 16).replace('T', ' ')}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={expandVariant}
            initial="hidden" animate="visible" exit="exit"
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
              {entry.error_message && (
                <div className="small p-2 rounded-2 mb-2" style={{ background: 'rgba(220,53,69,0.08)', color: 'var(--danger)' }}>
                  {entry.error_message}
                </div>
              )}
              {entry.raw_prompt && (
                <>
                  <div className="small fw-semibold mb-1">Prompt</div>
                  <pre
                    className="small p-2 rounded-2 mb-2"
                    style={{
                      whiteSpace: 'pre-wrap', background: 'var(--surface)',
                      maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {entry.raw_prompt}
                  </pre>
                </>
              )}
              {entry.output_json && (
                <>
                  <div className="small fw-semibold mb-1">Response</div>
                  <pre
                    className="small p-2 rounded-2"
                    style={{
                      whiteSpace: 'pre-wrap', background: 'var(--surface)',
                      maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {entry.output_json}
                  </pre>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
