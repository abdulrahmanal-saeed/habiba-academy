import type { FC } from 'react'
import type { DeviceBreakdown } from '../types'

interface DevicePieProps {
  data: DeviceBreakdown[]
}

const COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-mint)']

export const DevicePie: FC<DevicePieProps> = ({ data }) => {
  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + Number(d.cnt), 0) || 1

  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => {
        const pct = Math.round((Number(d.cnt) / total) * 100)
        return (
          <div key={d.device_type} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize font-semibold" style={{ color: 'var(--fg)' }}>
                {d.device_type || 'unknown'}
              </span>
              <span style={{ color: 'var(--muted)' }}>{pct}% ({d.cnt.toLocaleString()})</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
