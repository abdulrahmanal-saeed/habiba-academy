import type { FC } from 'react'
import type { AuditLogEntry } from '../types'

interface AuditLogProps {
  entries: AuditLogEntry[]
}

function formatDate(str: string): string {
  return new Date(str).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const AuditLog: FC<AuditLogProps> = ({ entries }) => {
  if (entries.length === 0) {
    return <div className="text-xs py-4" style={{ color: 'var(--muted)' }}>No audit events yet.</div>
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="py-2.5"
          style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>{entry.action}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {formatDate(entry.created_at)}
            {entry.old_value && entry.new_value && (
              <> · <span style={{ color: 'var(--danger)' }}>{entry.old_value}</span> → <span style={{ color: 'var(--success)' }}>{entry.new_value}</span></>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
