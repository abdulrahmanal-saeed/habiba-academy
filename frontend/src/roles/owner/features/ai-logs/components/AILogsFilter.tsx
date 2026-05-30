import type { FC } from 'react'

interface Props {
  features: string[]
  feature: string
  status: string
  onFeatureChange: (f: string) => void
  onStatusChange: (s: string) => void
}

export const AILogsFilter: FC<Props> = ({
  features, feature, status, onFeatureChange, onStatusChange,
}) => (
  <div
    className="d-flex gap-2 flex-wrap align-items-end mb-3 p-3 rounded-3"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div style={{ minWidth: 180 }}>
      <label className="form-label small mb-1">Feature</label>
      <select
        className="form-select form-select-sm"
        value={feature}
        onChange={(e) => onFeatureChange(e.target.value)}
      >
        <option value="">All features</option>
        {features.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </div>
    <div style={{ minWidth: 140 }}>
      <label className="form-label small mb-1">Status</label>
      <select
        className="form-select form-select-sm"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">All</option>
        <option value="success">Success</option>
        <option value="failed">Failed</option>
        <option value="cached">Cached</option>
      </select>
    </div>
    {(feature || status) && (
      <button
        type="button" className="btn btn-ghost btn-sm align-self-end"
        onClick={() => { onFeatureChange(''); onStatusChange('') }}
      >
        Clear
      </button>
    )}
  </div>
)
