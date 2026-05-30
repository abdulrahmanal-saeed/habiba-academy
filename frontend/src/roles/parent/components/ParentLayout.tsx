import type { FC, ReactNode } from 'react'
import { ThemeToggle } from '@/core/components/ThemeToggle'

interface ParentLayoutProps {
  children: ReactNode
}

export const ParentLayout: FC<ParentLayoutProps> = ({ children }) => (
  <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
        أكاديمية حبيبة نبيل
      </span>
      <div className="flex items-center gap-2">
        <ThemeToggle variant="icon" />
        <span
          className="rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          ولي الأمر
        </span>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
  </div>
)
