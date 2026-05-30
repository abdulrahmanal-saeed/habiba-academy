import type { FC } from 'react'
import { motion } from 'framer-motion'
import type { AISettingsData } from '../types'
import { cardVariant } from '../animations'

const STATUS_COLOR: Record<string, string> = {
  configured: 'var(--accent)',
  'not configured': 'var(--warning)',
  'connection failed': 'var(--danger)',
}

interface Props {
  data: AISettingsData
  onTest: () => void
  loading: boolean
}

export const AIConnectionCard: FC<Props> = ({ data, onTest, loading }) => {
  const { connection, api_key_status, connection_checked_at } = data
  const badgeColor = STATUS_COLOR[connection.status] ?? 'var(--muted)'

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.25rem', marginBottom: '1rem',
      }}
    >
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <div className="fw-bold mb-1">AI Connection Status</div>
          <div
            className="small p-2 rounded-2 mb-2"
            style={{ background: 'var(--surface-2)', fontFamily: 'monospace', color: 'var(--muted)' }}
          >
            {api_key_status}
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>{connection.message}</div>
          {connection_checked_at && (
            <div className="small mt-1" style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
              Last checked: {connection_checked_at}
            </div>
          )}
        </div>
        <div className="d-flex flex-column align-items-end gap-2">
          <span className="badge" style={{ background: badgeColor, color: '#fff' }}>
            {connection.status}
          </span>
          <motion.button
            type="button" className="btn btn-app btn-sm"
            disabled={loading}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
            onClick={onTest}
          >
            {loading ? 'Testing…' : 'Test AI Connection'}
          </motion.button>
        </div>
      </div>
      <div
        className="small mt-2 p-2 rounded-2"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
      >
        API key lives on the server environment only — never paste it in this form.
      </div>
    </motion.div>
  )
}
