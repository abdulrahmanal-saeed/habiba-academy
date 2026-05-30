import { useState, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid, BookOpen, Play, Layers, Wallet, Calendar,
  BarChart2, Star, Bell, HelpCircle, User, LogOut, Menu, X,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { useAuthStore } from '@/core/stores/authStore'
import { ThemeToggle } from '@/core/components/ThemeToggle'
import { logout } from '../features/auth/api'

type LucideIcon = FC<LucideProps>

interface NavItem {
  key: string
  label: string
  to: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',     label: 'Dashboard',        to: '/student',               Icon: Grid },
  { key: 'books',         label: 'Interactive Books', to: '/student/book',          Icon: BookOpen },
  { key: 'materials',     label: 'Materials',         to: '/student/materials',     Icon: Play },
  { key: 'flashcards',    label: 'Flashcards',        to: '/student/flashcards',    Icon: Layers },
  { key: 'balance',       label: 'Balance',           to: '/student/balance',       Icon: Wallet },
  { key: 'notes',         label: 'Session Notes',     to: '/student/schedule',      Icon: Calendar },
  { key: 'progress',      label: 'Progress',          to: '/student/progress',      Icon: BarChart2 },
  { key: 'testimonial',   label: 'Testimonial',       to: '/student/testimonial',   Icon: Star },
  { key: 'notifications', label: 'Notifications',     to: '/student/notifications', Icon: Bell },
  { key: 'help',          label: 'Help',              to: '/student/help',          Icon: HelpCircle },
  { key: 'profile',       label: 'Profile',           to: '/student/profile',       Icon: User },
]

const ACTIVE_STYLE = {
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  border: '1px solid rgba(13,79,79,0.18)',
}
const IDLE_STYLE = {
  color: 'var(--fg)',
  border: '1px solid transparent',
}

const SIDEBAR_W = 280

export const StudentSidebar: FC = () => {
  const location  = useLocation()
  const navigate  = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 992px)').matches,
  )

  // Track breakpoint changes
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 992px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Escape key closes mobile drawer
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  const close = useCallback(() => setIsOpen(false), [])

  async function handleLogout(): Promise<void> {
    try { await logout() } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  function isActive(to: string, key: string): boolean {
    if (key === 'dashboard') return location.pathname === '/student' || location.pathname === '/student/'
    return location.pathname.startsWith(to)
  }

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-4 border-b"
        style={{
          borderColor: 'var(--border)',
          background: 'linear-gradient(180deg, var(--accent-soft), transparent)',
        }}
      >
        <Link
          to="/student"
          onClick={close}
          className="flex items-center gap-2 font-black text-base no-underline"
          style={{ color: 'var(--accent)' }}
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
          Habiba Nabil
        </Link>
        {!isDesktop && (
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--fg)' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto" aria-label="Student navigation">
        {NAV_ITEMS.map(({ key, label, to, Icon }) => {
          const active = isActive(to, key)
          return (
            <Link
              key={key}
              to={to}
              onClick={close}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold min-h-[44px] no-underline transition-colors"
              style={active ? ACTIVE_STYLE : IDLE_STYLE}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: theme + logout */}
      <div className="px-2 py-3 border-t flex flex-col gap-0.5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>المظهر</span>
          <ThemeToggle variant="group" />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full min-h-[44px]"
          style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  )

  // Desktop: static sidebar in flex layout
  if (isDesktop) {
    return (
      <aside
        style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--surface)',
          borderInlineEnd: '1px solid var(--border)',
          overflowY: 'auto',
        }}
        aria-label="Student navigation"
      >
        {navContent}
      </aside>
    )
  }

  // Mobile: FAB + drawer overlay
  return (
    <>
      {/* FAB trigger */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-5 end-5 z-[1070] flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm"
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
        }}
        aria-label="Open navigation menu"
      >
        <Menu size={18} />
        Menu
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={close}
              className="fixed inset-0 z-[1080]"
              style={{ background: 'rgba(15,23,42,0.36)', backdropFilter: 'blur(2px)' }}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 start-0 z-[1090] h-full"
              style={{
                width: 'min(300px, 86vw)',
                background: 'var(--surface)',
                borderInlineEnd: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
              }}
              aria-label="Student navigation"
              role="dialog"
              aria-modal="true"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
