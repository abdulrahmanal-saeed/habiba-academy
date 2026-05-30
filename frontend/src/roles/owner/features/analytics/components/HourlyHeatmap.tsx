import type { FC } from 'react'
import type { HourlyPattern } from '../types'

interface HourlyHeatmapProps {
  data: HourlyPattern[]
}

export const HourlyHeatmap: FC<HourlyHeatmapProps> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.cnt), 1)

  return (
    <div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
        {data.map((d) => {
          const intensity = d.cnt / max
          return (
            <div
              key={d.hr}
              title={`${d.hr}:00 — ${d.cnt} visits`}
              className="rounded-sm"
              style={{
                height: 24,
                background: `rgba(13, 79, 79, ${Math.max(0.08, intensity)})`,
              }}
            />
          )
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>12am</span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>12pm</span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>11pm</span>
      </div>
    </div>
  )
}
