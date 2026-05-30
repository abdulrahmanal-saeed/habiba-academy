import { createContext } from 'react'
import type { User, RoleType } from '@/core/types'

export interface AuthContextValue {
  user: User | null
  role: RoleType | null
  isAuthenticated: boolean
  isLoading: boolean
}

/* Context object lives here so it can be imported by both
   AuthProvider.tsx and useAuth.ts without fast-refresh conflicts */
export const AuthContext = createContext<AuthContextValue | null>(null)
