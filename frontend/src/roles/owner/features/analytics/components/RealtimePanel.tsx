import type { FC } from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { useRealtime } from '../hooks/useRealtime'

function DeviceIcon({ type }: { type: string }) {
  if (type === 'mobile')  return <Smartphone size={13} />
  if (type === 'tablet')  return <Tablet size={13} />
  return <Monitor size={13} />
}

function timeAgo(dateStr: string): string {
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (sec < 60)  return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

export const RealtimePanel: FC = () => {
  const { data, isLoading } = useRealtime()
  const sessions = data?.sessions ?? []

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: sessions.length > 0 ? 'var(--success)' : 'var(--muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Live — {sessions.length} active
          </span>
        </div>
        {isLoading && <span className="text-xs" style={{ color: 'var(--muted)' }}>refreshing…</span>}
      </div>
      <div className="divide-y" style={{ background: 'var(--bg)' }}>
        {sessions.length === 0 ? (
          <div className="px-4 py-6 text-xs text-center" style={{ color: 'var(--muted)' }}>
            No active sessions in the last 3 minutes.
          </div>
        ) : sessions.map((s) => (
          <div key={s.session_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ color: 'var(--muted)' }}><DeviceIcon type={s.device_type} /></span>
              <span className="text-xs truncate" style={{ color: 'var(--fg)' }}>
                {s.page_url ?? '/'}
              </span>
            </div>
            <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>
              {timeAgo(s.last_activity_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
