/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type FC, type ReactElement } from 'react'
import {
  createBrowserRouter,
  Outlet,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { Spinner } from '@/design-system/components'
import { pageTransition } from '@/design-system/animations'

/* ── Lazy role chunks ────────────────────────────────────────────── */
const PublicApp     = lazy(() => import('@/roles/public'))
const LevelTestPage    = lazy(() => import('@/roles/public/features/level-test/LevelTestPage'))
const CheckoutPage       = lazy(() => import('@/roles/public/features/checkout/CheckoutPage'))
const CheckoutStatusPage = lazy(() => import('@/roles/public/features/checkout/CheckoutStatusPage'))
const ArticlesListPage = lazy(() => import('@/roles/public/features/articles/ArticlesListPage'))
const ArticlePage      = lazy(() => import('@/roles/public/features/articles/ArticlePage'))
const VideosListPage   = lazy(() => import('@/roles/public/features/videos/VideosListPage'))
const VideoPage        = lazy(() => import('@/roles/public/features/videos/VideoPage'))
const HelpPage         = lazy(() => import('@/roles/public/features/help/HelpPage'))
const StudentLoginPage = lazy(() =>
  import('@/roles/student/features/auth').then((m) => ({ default: m.StudentLoginPage })),
)
const TeacherLoginPage = lazy(() =>
  import('@/roles/teacher/features/auth').then((m) => ({ default: m.TeacherLoginPage })),
)
const DevLogin = import.meta.env.DEV
  ? lazy(() =>
      import('@/roles/student/features/auth/DevLogin').then((m) => ({ default: m.DevLogin })),
    )
  : null
const StudentApp    = lazy(() => import('@/roles/student'))
const TeacherApp    = lazy(() => import('@/roles/teacher'))
const OwnerApp      = lazy(() => import('@/roles/owner'))
const ParentApp     = lazy(() => import('@/roles/parent'))
const AcademyApp    = lazy(() => import('@/roles/academy'))
const MediaBuyerApp = lazy(() => import('@/roles/media-buyer'))
const ParentLoginPage  = lazy(() =>
  import('@/roles/parent/features/auth').then((m) => ({ default: m.ParentLoginPage })),
)
const AcademyLoginPage = lazy(() =>
  import('@/roles/academy/features/auth').then((m) => ({ default: m.AcademyLoginPage })),
)

/* ── Shared fallback ─────────────────────────────────────────────── */
const PageFallback: FC = () => (
  <div
    className="flex h-screen items-center justify-center"
    style={{ background: 'var(--bg)' }}
  >
    <Spinner size="lg" />
  </div>
)

function lazy$(el: ReactElement): ReactElement {
  return <Suspense fallback={<PageFallback />}>{el}</Suspense>
}

/* ── Root layout with AnimatePresence page transitions ───────────── */
const RootLayout: FC = () => {
  const location = useLocation()
  /* Key on the first path segment — triggers transition between roles */
  const routeKey = location.pathname.split('/')[1] || 'home'

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        className="min-h-screen"
        style={{ background: 'var(--bg)' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Static pages (no lazy needed) ──────────────────────────────── */
const NotFound: FC = () => (
  <div
    className="flex h-screen flex-col items-center justify-center gap-4"
    style={{ background: 'var(--bg)' }}
  >
    <h1 className="text-5xl font-bold" style={{ color: 'var(--accent)' }}>404</h1>
    <p style={{ color: 'var(--muted)' }}>Page not found</p>
    <a href="/" style={{ color: 'var(--accent)' }} className="underline underline-offset-4">
      Go home
    </a>
  </div>
)

const Unauthorized: FC = () => (
  <div
    className="flex h-screen flex-col items-center justify-center gap-4"
    style={{ background: 'var(--bg)' }}
  >
    <h1 className="text-5xl font-bold" style={{ color: 'var(--danger)' }}>403</h1>
    <p style={{ color: 'var(--muted)' }}>You don't have permission to view this page.</p>
    <a href="/" style={{ color: 'var(--accent)' }} className="underline underline-offset-4">
      Go home
    </a>
  </div>
)

/* ── Router ──────────────────────────────────────────────────────── */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      /* Public — no auth required */
      { index: true,        element: lazy$(<PublicApp />) },
      { path: 'login',      element: lazy$(<StudentLoginPage />) },
      { path: 'level-test',          element: lazy$(<LevelTestPage />) },
      { path: 'checkout/:planSlug',  element: lazy$(<CheckoutPage />) },
      { path: 'checkout/status',    element: lazy$(<CheckoutStatusPage />) },
      { path: 'articles',            element: lazy$(<ArticlesListPage />) },
      { path: 'articles/:slug',      element: lazy$(<ArticlePage />) },
      { path: 'videos',              element: lazy$(<VideosListPage />) },
      { path: 'videos/:slug',        element: lazy$(<VideoPage />) },
      { path: 'help',                element: lazy$(<HelpPage />) },
      { path: 'teacher/login',       element: lazy$(<TeacherLoginPage />) },
      { path: 'parent/login',        element: lazy$(<ParentLoginPage />) },
      { path: 'academy/login',       element: lazy$(<AcademyLoginPage />) },

      /* Dev-only bypass */
      ...(import.meta.env.DEV && DevLogin
        ? [{ path: 'dev-login', element: lazy$(<DevLogin />) }]
        : []),

      /* Static error pages */
      { path: 'unauthorized', element: <Unauthorized /> },

      /* Protected role portals */
      {
        path: 'student/*',
        element: (
          <AuthGuard role="student">{lazy$(<StudentApp />)}</AuthGuard>
        ),
      },
      {
        path: 'teacher/*',
        element: (
          <AuthGuard role="teacher">{lazy$(<TeacherApp />)}</AuthGuard>
        ),
      },
      {
        path: 'owner/*',
        element: (
          <AuthGuard role="owner">{lazy$(<OwnerApp />)}</AuthGuard>
        ),
      },
      {
        path: 'parent/*',
        element: (
          <AuthGuard role="parent">{lazy$(<ParentApp />)}</AuthGuard>
        ),
      },
      {
        path: 'academy/*',
        element: (
          <AuthGuard role="academy">{lazy$(<AcademyApp />)}</AuthGuard>
        ),
      },
      {
        path: 'media-buyer/*',
        element: (
          <AuthGuard role="media-buyer">{lazy$(<MediaBuyerApp />)}</AuthGuard>
        ),
      },

      /* 404 catch-all */
      { path: '*', element: <NotFound /> },
    ],
  },
])
