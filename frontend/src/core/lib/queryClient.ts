import { QueryClient } from '@tanstack/react-query'
import { toast } from '@/design-system/components'

/* ── Per-feature stale times (from docs/ARCHITECTURE.md) ────────────── */
export const STALE = {
  dashboard: 30 * 1000,           // 30s  — changes frequently
  students:  2  * 60 * 1000,      // 2min
  materials: 5  * 60 * 1000,      // 5min
  articles:  60 * 60 * 1000,      // 1hr  — rarely changes
  settings:  30 * 60 * 1000,      // 30min
  help:      10 * 60 * 1000,      // 10min
} as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.dashboard,  // 30s default; override per-query with STALE.*
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Something went wrong'
        toast.error(message)
      },
    },
  },
})
