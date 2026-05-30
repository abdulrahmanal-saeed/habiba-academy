import { useState, useEffect, useRef, useCallback } from 'react'
import type { FC, RefObject } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BarChart2, CreditCard, FileText, Video,
  Star, HelpCircle, Settings, Cpu, Shield,
  Building2, Target, BookOpen, LogOut, Users,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { useAuthStore } from '@/core/stores/authStore'
import { ThemeToggle } from '@/core/components/ThemeToggle'
import { logout } from '../../teacher/features/auth/api'

type LucideIcon = FC<LucideProps>

interface NavItem {
  key: string
  label: string
  to: string
  Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',  label: 'Dashboard',   to: '/owner',            Icon: Home },
  { key: 'students',   label: 'Students',    to: '/owner/students',   Icon: Users },
  { key: 'analytics',  label: 'Analytics',   to: '/owner/analytics',  Icon: BarChart2 },
  { key: 'payments',   label: 'Payments',    to: '/owner/payments',   Icon: CreditCard },
  { key: 'articles',   label: 'Articles',    to: '/owner/articles',   Icon: FileText },
  { key: 'videos',     label: 'Videos',      to: '/owner/videos',     Icon: Video },
  { key: 'testimonials', label: 'Testimonials', to: '/owner/testimonials', Icon: Star },
  { key: 'help-cms',   label: 'Help CMS',    to: '/owner/help-cms',   Icon: HelpCircle },
  { key: 'academies',  label: 'Academies',   to: '/owner/academies',  Icon: Building2 },
  { key: 'media-buyers', label: 'Media Buyers', to: '/owner/media-buyers', Icon: Target },
  { key: 'book-launch', label: 'Book Launch', to: '/owner/book-launch', Icon: BookOpen },
  { key: 'ai-settings', label: 'AI Settings', to: '/owner/ai-settings', Icon: Cpu },
  { key: 'audit-log',  label: 'Audit Log',   to: '/owner/audit-log',  Icon: Shield },
  { key: 'settings',   label: 'Settings',    to: '/owner/settings',   Icon: Settings },
]

const RAIL_W = 64

export const OwnerSidebar: FC = () => {
  const location  = useLocation()
  const navigate  = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const [activePopover, setActivePopover] = useState<string | null>(null)
  const [popoverY, setPopoverY] = useState(0)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const closePopover = useCallback(() => setActivePopover(null), [])

  useEffect(() => {
    if (!activePopover) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopover() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [activePopover, closePopover])

  useEffect(() => {
    if (!activePopover) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const rail   = document.getElementById('owner-rail')
      const pop    = document.getElementById('owner-popover')
      if (rail?.contains(target) || pop?.contains(target)) return
      closePopover()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activePopover, closePopover])

  function togglePopover(key: string, ref: RefObject<HTMLButtonElement | null>): void {
    if (activePopover === key) { closePopover(); return }
    const rect = ref.current?.getBoundingClientRect()
    setPopoverY(rect ? rect.top : 0)
    setActivePopover(key)
  }

  function isActive(to: string, key: string): boolean {
    if (key === 'dashboard') return location.pathname === '/owner' || location.pathname === '/owner/'
    return location.pathname.startsWith(to)
  }

  async function handleLogout(): Promise<void> {
    try { await logout() } finally {
      clearAuth()
      navigate('/teacher/login', { replace: true })
    }
  }

  const activeItem = NAV_ITEMS.find((item) => activePopover === item.key)

  return (
    <>
      <aside
        id="owner-rail"
        style={{
          width: RAIL_W, flexShrink: 0, height: '100vh',
          position: 'sticky', top: 0,
          background: 'var(--surface)',
          borderInlineEnd: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', paddingBlock: '1rem',
          overflowY: 'auto', zIndex: 100,
        }}
        aria-label="Owner navigation"
      >
        <Link
          to="/owner"
          className="flex items-center justify-center w-9 h-9 rounded-xl mb-4"
          style={{ background: 'var(--accent)', flexShrink: 0 }}
          aria-label="Dashboard"
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#fff' }} />
        </Link>

        <nav className="flex flex-col items-center gap-1 flex-1 w-full px-1.5" aria-label="Owner navigation">
          {NAV_ITEMS.map(({ key, label, to, Icon }) => {
            const active = isActive(to, key)
            const open   = activePopover === key
            return (
              <button
                key={key}
                ref={(el) => { buttonRefs.current[key] = el }}
                type="button"
                onClick={() => togglePopover(key, { current: buttonRefs.current[key] })}
                title={label}
                aria-label={label}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
                style={{
                  background: active || open ? 'var(--accent-soft)' : 'transparent',
                  color: active || open ? 'var(--accent)' : 'var(--muted)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <Icon size={18} />
              </button>
            )
          })}
        </nav>

        {/* Theme toggle */}
        <ThemeToggle variant="group" className="flex-col mb-1 mt-2" />

        {/* Logout */}
        <button
          type="button"
          onClick={() => void handleLogout()}
          title="Logout"
          aria-label="Logout"
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={18} />
        </button>
      </aside>

      <AnimatePresence>
        {activeItem && (
          <motion.div
            id="owner-popover"
            key={activeItem.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed', left: RAIL_W, top: popoverY,
              zIndex: 200, background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem', boxShadow: 'var(--shadow-lg)',
              minWidth: 160, padding: '0.5rem',
            }}
          >
            <Link
              to={activeItem.to}
              onClick={closePopover}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline"
              style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              <activeItem.Icon size={16} />
              {activeItem.label}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
