import type { FC, ChangeEvent } from 'react'
import { Search } from 'lucide-react'

type ActiveTab = 'active' | 'inactive'

interface StudentFiltersProps {
  query: string
  tab: ActiveTab
  activeCount: number
  inactiveCount: number
  onQueryChange: (q: string) => void
  onTabChange: (tab: ActiveTab) => void
}

export const StudentFilters: FC<StudentFiltersProps> = ({
  query,
  tab,
  activeCount,
  inactiveCount,
  onQueryChange,
  onTabChange,
}) => (
  <div className="flex flex-col gap-3">
    {/* Search */}
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <Search size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
      <input
        type="text"
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onQueryChange(e.target.value)}
        placeholder="Search by name or code…"
        className="flex-1 text-sm bg-transparent outline-none"
        style={{ color: 'var(--fg)', border: 'none' }}
      />
    </div>

    {/* Tabs */}
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onTabChange('active')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        style={{
          background: tab === 'active' ? 'var(--accent-soft)' : 'var(--surface)',
          color: tab === 'active' ? 'var(--accent)' : 'var(--muted)',
          border: `1px solid ${tab === 'active' ? 'rgba(13,79,79,0.18)' : 'var(--border)'}`,
          cursor: 'pointer',
        }}
      >
        Active
        <span
          className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none"
          style={{
            background: tab === 'active' ? 'var(--accent)' : 'var(--bg)',
            color: tab === 'active' ? '#fff' : 'var(--muted)',
          }}
        >
          {activeCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('inactive')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        style={{
          background: tab === 'inactive' ? 'var(--accent-soft)' : 'var(--surface)',
          color: tab === 'inactive' ? 'var(--accent)' : 'var(--muted)',
          border: `1px solid ${tab === 'inactive' ? 'rgba(13,79,79,0.18)' : 'var(--border)'}`,
          cursor: 'pointer',
        }}
      >
        Inactive
        <span
          className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none"
          style={{
            background: tab === 'inactive' ? 'var(--accent)' : 'var(--bg)',
            color: tab === 'inactive' ? '#fff' : 'var(--muted)',
          }}
        >
          {inactiveCount}
        </span>
      </button>
    </div>
  </div>
)
