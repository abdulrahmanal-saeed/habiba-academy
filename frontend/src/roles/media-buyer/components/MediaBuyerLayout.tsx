import type { FC, ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ThemeToggle } from '@/core/components/ThemeToggle'

interface Props { children: ReactNode }

const NAV = [
  { to: '/media-buyer',             label: 'الرئيسية',  end: true  },
  { to: '/media-buyer/tracking',    label: 'الروابط',   end: false },
  { to: '/media-buyer/campaigns',   label: 'الحملات',   end: false },
  { to: '/media-buyer/commissions', label: 'العمولات',  end: false },
]

export const MediaBuyerLayout: FC<Props> = ({ children }) => (
  <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
    <header
      className="sticky top-0 z-40"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
          ميديا باير
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="icon" />
          <Link
            to="/media-buyer/notifications"
            className="text-xs font-medium"
            style={{ color: 'var(--muted)' }}
          >
            الإشعارات
          </Link>
          <span
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            شريك تسويقي
          </span>
        </div>
      </div>

      <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pb-0">
        {NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="shrink-0 border-b-2 px-3 py-2 text-xs font-medium transition-colors"
            style={({ isActive }) => ({
              borderColor: isActive ? 'var(--accent)' : 'transparent',
              color:       isActive ? 'var(--accent)' : 'var(--muted)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>

    <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
  </div>
)
