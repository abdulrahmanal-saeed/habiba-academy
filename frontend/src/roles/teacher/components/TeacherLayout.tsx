import type { FC, ReactNode } from 'react'
import { TeacherSidebar } from './TeacherSidebar'
import { NotificationBell } from '../features/notifications'

interface TeacherLayoutProps {
  children: ReactNode
}

export const TeacherLayout: FC<TeacherLayoutProps> = ({ children }) => (
  <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
    <TeacherSidebar />
    <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
      <header
        className="flex items-center justify-end px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <NotificationBell />
      </header>
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  </div>
)
