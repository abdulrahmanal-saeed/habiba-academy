import type { FC } from 'react'
import type { DailyVisit } from '../types'

interface DailyChartProps {
  data: DailyVisit[]
}

const CHART_H = 120
const BAR_GAP = 3

export const DailyChart: FC<DailyChartProps> = ({ data }) => {
  if (data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs" style={{ color: 'var(--muted)' }}>No visit data yet</div>
  }

  const max = Math.max(...data.map((d) => d.visit_count), 1)
  const barW = Math.max(4, Math.floor((560 - BAR_GAP * data.length) / data.length))
  const svgW  = (barW + BAR_GAP) * data.length

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${CHART_H + 24}`}
        style={{ width: '100%', minWidth: Math.min(svgW, 320), height: CHART_H + 24 }}
        aria-label="Daily visits chart"
      >
        {data.map((d, i) => {
          const barH  = Math.max(2, Math.round((d.visit_count / max) * CHART_H))
          const x     = i * (barW + BAR_GAP)
          const y     = CHART_H - barH
          const isLast = i === data.length - 1
          return (
            <g key={d.day_key}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={2} fill="var(--accent)"
                opacity={isLast ? 1 : 0.65}
              />
              {i % 7 === 0 && (
                <text x={x} y={CHART_H + 16} fontSize={8} fill="var(--muted)" textAnchor="start">
                  {d.day_key.slice(5)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
