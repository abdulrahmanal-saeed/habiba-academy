import { useEffect, type FC, type ReactNode } from 'react'
import { AuthContext } from './authContext'
import { useAuthStore } from '@/core/stores/authStore'
import { fetchCsrfToken } from '@/core/lib/apiClient'

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const checkSession = useAuthStore((s) => s.checkSession)

  useEffect(() => {
    /* Fetch CSRF token and restore session — both are GET, parallel is fine */
    void Promise.all([fetchCsrfToken(), checkSession()])
  }, [checkSession])

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
