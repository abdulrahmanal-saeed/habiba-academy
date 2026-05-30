import type { FC, ReactNode } from 'react'
import { StudentSidebar } from './StudentSidebar'

interface StudentLayoutProps {
  children: ReactNode
}

export const StudentLayout: FC<StudentLayoutProps> = ({ children }) => (
  <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
    <StudentSidebar />
    <main className="flex-1 min-w-0 overflow-x-hidden">
      {children}
    </main>
  </div>
)
