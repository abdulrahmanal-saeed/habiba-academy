import type { FC, ReactNode } from 'react'
import { OwnerSidebar } from './OwnerSidebar'

interface OwnerLayoutProps {
  children: ReactNode
}

export const OwnerLayout: FC<OwnerLayoutProps> = ({ children }) => (
  <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
    <OwnerSidebar />
    <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
      <header
        className="flex items-center justify-end px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <span
          className="px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          Owner
        </span>
      </header>
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  </div>
)
