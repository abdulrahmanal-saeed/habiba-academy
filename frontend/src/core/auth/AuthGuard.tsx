import type { FC, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/core/auth'
import { Spinner } from '@/design-system/components'
import type { RoleType } from '@/core/types'

export interface AuthGuardProps {
  /** Single role or array of allowed roles for this route */
  role: RoleType | RoleType[]
  children: ReactNode
}

/** Role-specific login route for unauthenticated visitors. */
function loginPathForRole(role: RoleType): string {
  switch (role) {
    case 'parent':
      return '/parent/login'
    case 'academy':
      return '/academy/login'
    case 'owner':
    case 'teacher':
      return '/teacher/login'
    default:
      return '/login'
  }
}

export const AuthGuard: FC<AuthGuardProps> = ({ role, children }) => {
  const { isAuthenticated, role: userRole, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: 'var(--bg)' }}
        aria-label="Checking session…"
      >
        <Spinner size="lg" />
      </div>
    )
  }

  const allowed = Array.isArray(role) ? role : [role]

  if (!isAuthenticated) {
    return <Navigate to={loginPathForRole(allowed[0])} replace />
  }

  if (!userRole || !allowed.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
