import { useState } from 'react'
import type { FC, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { fadeInUp, stagger, cardVariant } from '@/design-system/animations'
import { useAuditLog } from './hooks/useAuditLog'
import type { AuditLogEntry } from './types'

const LIMIT = 50

function EntryRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <motion.div
      variants={cardVariant}
      className="grid gap-y-0.5 rounded-xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="rounded px-1.5 py-0.5 font-mono text-xs shrink-0"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {entry.entity_type}
          </span>
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{entry.action}</span>
        </div>
        <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>
          {entry.created_at.slice(0, 16)} · {entry.actor_type}
          {entry.ip_address ? ` · ${entry.ip_address}` : ''}
        </span>
      </div>
      {(entry.old_value || entry.new_value) && (
        <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          {entry.old_value && <span>← {entry.old_value.slice(0, 80)}</span>}
          {entry.old_value && entry.new_value && <span> → </span>}
          {entry.new_value && <span style={{ color: 'var(--fg)' }}>{entry.new_value.slice(0, 80)}</span>}
        </div>
      )}
    </motion.div>
  )
}

export const AuditLogPage: FC = () => {
  const [entityType, setEntityType] = useState('')
  const [action,     setAction]     = useState('')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [offset,     setOffset]     = useState(0)

  const filters = {
    entity_type: entityType || undefined,
    action: action || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    limit: LIMIT,
    offset,
  }

  const { data, isLoading } = useAuditLog(filters)

  function handleFilter(setter: (v: string) => void) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value)
      setOffset(0)
    }
  }

  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    borderRadius: 'var(--radius)',
    padding: '6px 10px',
    fontSize: '0.8125rem',
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-5 p-4">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Audit Log</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <select value={entityType} onChange={handleFilter(setEntityType)} style={inputStyle}>
          <option value="">All types</option>
          {data?.entity_types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div className="relative">
          <Search size={13} className="absolute inset-y-0 start-2.5 m-auto" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={action}
            onChange={handleFilter(setAction)}
            placeholder="Filter action…"
            style={{ ...inputStyle, paddingInlineStart: '1.75rem' }}
          />
        </div>

        <input type="date" value={dateFrom} onChange={handleFilter(setDateFrom)} style={inputStyle} />
        <input type="date" value={dateTo}   onChange={handleFilter(setDateTo)}   style={inputStyle} />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {data?.total ?? 0} entries · showing {offset + 1}–{Math.min((offset + LIMIT), data?.total ?? 0)}
          </p>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
            {(data?.logs ?? []).map((e: AuditLogEntry) => <EntryRow key={e.id} entry={e} />)}
            {!data?.logs.length && (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No entries found.</p>
            )}
          </motion.div>

          {/* Pagination */}
          {(data?.total ?? 0) > LIMIT && (
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                disabled={offset === 0}
                className="rounded-xl px-3 py-1.5 text-sm disabled:opacity-40"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer' }}
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setOffset(offset + LIMIT)}
                disabled={offset + LIMIT >= (data?.total ?? 0)}
                className="rounded-xl px-3 py-1.5 text-sm disabled:opacity-40"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
