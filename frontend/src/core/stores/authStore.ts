import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as apiGet } from '@/core/lib/apiClient'
import type { User, RoleType } from '@/core/types'

interface AuthState {
  user: User | null
  role: RoleType | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setAuth: (user: User, role: RoleType) => void
  clearAuth: () => void
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, role) =>
        set({ user, role, isAuthenticated: true, isLoading: false }),

      clearAuth: () =>
        set({ user: null, role: null, isAuthenticated: false, isLoading: false }),

      checkSession: async () => {
        set({ isLoading: true })
        try {
          const data = await apiGet<{ ok: true; user: User; role: RoleType }>(
            '/api/auth/me',
          )
          set({ user: data.user, role: data.role, isAuthenticated: true, isLoading: false })
        } catch {
          set({ user: null, role: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => sessionStorage),
      /* Only persist auth identity — never persist isLoading */
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
