import { useState } from 'react'
import type { ChangeEvent, FormEvent, FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { School } from 'lucide-react'
import { fadeInUp, cardVariant } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useAuthStore } from '@/core/stores/authStore'
import { fetchCsrfToken } from '@/core/lib/apiClient'
import { loginAcademy } from './api'

export const AcademyLoginPage: FC = () => {
  const navigate        = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole        = useAuthStore((s) => s.role)
  const setAuth         = useAuthStore((s) => s.setAuth)

  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated && userRole) {
    void navigate(`/${userRole}`, { replace: true })
    return null
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>): void {
    setCode(e.target.value.toUpperCase())
    if (error) setError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const academy = await loginAcademy(trimmed)
      await fetchCsrfToken()
      setAuth({ id: academy.id, name: academy.name, role: 'academy' }, 'academy')
      navigate('/academy', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <a href="/" className="flex items-center gap-2 font-black text-lg no-underline" style={{ color: 'var(--accent)' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
          Habiba Nabil
        </a>
      </nav>

      <main className="flex items-center justify-center px-4 py-10 min-h-[calc(100vh-57px)]">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm flex flex-col gap-5"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)' }}
            >
              <School size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              Academy Portal
            </span>
            <h1 className="text-2xl font-extrabold mt-1" style={{ color: 'var(--fg)' }}>
              Academy Login
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Enter your academy access code to continue
            </p>
          </div>

          <motion.div
            variants={cardVariant}
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                  role="alert"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Academy Code</span>
                <input
                  type="text"
                  value={code}
                  onChange={handleInput}
                  placeholder="e.g. AC-123456"
                  maxLength={12}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                  disabled={loading}
                  className="w-full rounded-xl px-4 py-3 text-base font-mono font-bold tracking-widest outline-none disabled:opacity-60"
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--fg)' }}
                />
              </label>

              <motion.button
                type="submit"
                disabled={loading || !code.trim()}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                {loading ? <Spinner size="sm" color="#fff" /> : 'Login'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
