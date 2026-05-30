import { useState, type FC } from 'react'
import { motion } from 'framer-motion'
import type { AISettings } from '../types'
import { cardVariant } from '../animations'

interface Props {
  settings: AISettings
  onSave: (s: AISettings) => void
  loading: boolean
}

export const AISettingsForm: FC<Props> = ({ settings, onSave, loading }) => {
  const [local, setLocal] = useState<AISettings>(settings)

  function set(key: keyof AISettings, value: string): void {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.5rem',
      }}
    >
      <div className="fw-bold fs-5 mb-3">AI Configuration</div>
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">AI Enabled</label>
          <select
            className="form-select"
            value={local.ai_enabled}
            onChange={(e) => set('ai_enabled', e.target.value as '0' | '1')}
          >
            <option value="1">Enabled</option>
            <option value="0">Disabled</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Provider</label>
          <input
            className="form-control"
            value={local.ai_provider}
            onChange={(e) => set('ai_provider', e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Model</label>
          <input
            className="form-control"
            placeholder="claude-haiku-4-5-20251001"
            value={local.ai_model}
            onChange={(e) => set('ai_model', e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Daily limit per tool</label>
          <input
            className="form-control" type="number" min={1}
            value={local.ai_regenerate_limit_per_day}
            onChange={(e) => set('ai_regenerate_limit_per_day', e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Input cost per 1k tokens (USD)</label>
          <input
            className="form-control"
            value={local.ai_cost_per_1k_input}
            onChange={(e) => set('ai_cost_per_1k_input', e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Output cost per 1k tokens (USD)</label>
          <input
            className="form-control"
            value={local.ai_cost_per_1k_output}
            onChange={(e) => set('ai_cost_per_1k_output', e.target.value)}
          />
        </div>
      </div>
      <motion.button
        type="button" className="btn btn-app mt-3"
        disabled={loading}
        whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
        onClick={() => onSave(local)}
      >
        {loading ? 'Saving…' : 'Save AI Settings'}
      </motion.button>
    </motion.div>
  )
}
