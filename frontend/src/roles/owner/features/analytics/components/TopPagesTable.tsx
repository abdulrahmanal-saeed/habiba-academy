import type { FC } from 'react'
import type { TopPage } from '../types'

interface TopPagesTableProps {
  data: TopPage[]
}

export const TopPagesTable: FC<TopPagesTableProps> = ({ data }) => {
  if (data.length === 0) return null

  const max = data[0]?.total_views || 1

  return (
    <div className="flex flex-col gap-2">
      {data.map((page, i) => {
        const pct = Math.round((page.total_views / max) * 100)
        return (
          <div key={page.page_url} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-xs gap-4">
              <span className="font-mono truncate min-w-0" style={{ color: 'var(--fg)' }}>
                {i + 1}. {page.page_url}
              </span>
              <span className="shrink-0 font-semibold" style={{ color: 'var(--muted)' }}>{page.total_views.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
