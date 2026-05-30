/* eslint-disable react-refresh/only-export-components */
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/core/auth'
import { ToastContainer, TooltipProvider } from '@/design-system/components'
import { queryClient } from '@/core/lib/queryClient'
import { router } from '@/router'
import './index.css'

/* ReactQueryDevtools — loaded only in dev, tree-shaken in production */
const ReactQueryDevtools = lazy(() =>
  import.meta.env.DEV
    ? import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    : Promise.resolve({ default: (): null => null }),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={400}>
          <RouterProvider router={router} />
          <ToastContainer />
          <Suspense>
            <ReactQueryDevtools />
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
