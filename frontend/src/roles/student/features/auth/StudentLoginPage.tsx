import { useState } from 'react'
import type { ChangeEvent, FormEvent, FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, MessageCircle, ClipboardCheck, ChevronDown } from 'lucide-react'
import { fadeInUp, cardVariant } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useAuthStore } from '@/core/stores/authStore'
import { fetchCsrfToken } from '@/core/lib/apiClient'
import { login } from './api'

export const StudentLoginPage: FC = () => {
  const navigate        = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole        = useAuthStore((s) => s.role)
  const setAuth         = useAuthStore((s) => s.setAuth)

  const [code,     setCode]     = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [waitOpen, setWaitOpen] = useState(false)

  // Already authenticated — redirect to the right portal
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
      const student = await login(trimmed)
      // Refresh CSRF token for the newly-created session
      await fetchCsrfToken()
      setAuth({ id: student.id, name: student.name, role: 'student' }, 'student')
      navigate('/student', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <a
          href="/"
          className="flex items-center gap-2 font-black text-lg no-underline"
          style={{ color: 'var(--accent)' }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
          Habiba Nabil
        </a>
      </nav>

      {/* Center content */}
      <main className="flex items-center justify-center px-4 py-10 min-h-[calc(100vh-57px)]">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm flex flex-col gap-5"
        >
          {/* Brand mark + kicker */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)' }}
            >
              <GraduationCap size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              Student Portal
            </span>
            <h1 className="text-2xl font-extrabold mt-1" style={{ color: 'var(--fg)' }}>
              Welcome Back!
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Enter your student code to continue
            </p>
            <p
              className="text-xs flex items-center gap-1.5"
              style={{ color: 'var(--success)' }}
            >
              <MessageCircle size={12} />
              Your code was sent via WhatsApp or Email after the level test
            </p>
          </div>

          {/* Card */}
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
                  style={{
                    background: 'var(--danger-soft)',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger)',
                  }}
                  role="alert"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                  Student Code
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={handleInput}
                  placeholder="e.g. AB-1234"
                  maxLength={10}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                  disabled={loading}
                  className="w-full rounded-xl px-4 py-3 text-base font-mono font-bold tracking-widest outline-none disabled:opacity-60"
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--fg)',
                  }}
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

            {/* Waiting accordion */}
            <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setWaitOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-sm font-semibold"
                style={{ color: 'var(--fg)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-expanded={waitOpen}
              >
                <span>Waiting for your code?</span>
                <motion.span
                  animate={{ rotate: waitOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex' }}
                >
                  <ChevronDown size={16} style={{ color: 'var(--muted)' }} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {waitOpen && (
                  <motion.div
                    key="wait"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="pt-3 flex flex-col gap-2.5">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                        ⏳ Codes are sent via WhatsApp or Email within{' '}
                        <strong>24–48 hours</strong> after completing the level test.
                      </p>
                      <a
                        href="https://wa.me/971509298326?text=Hi%20Habiba!%20I%20took%20the%20level%20test%20but%20haven't%20received%20my%20login%20code%20yet."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl no-underline"
                        style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                      >
                        <MessageCircle size={13} />
                        Ask Habiba on WhatsApp
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Level test CTA */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              New to Habiba Nabil Arabic?
            </p>
            <a
              href="/level-test"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl no-underline"
              style={{
                border: '1.5px solid var(--border)',
                color: 'var(--fg)',
                background: 'var(--surface)',
              }}
            >
              <ClipboardCheck size={14} />
              Take the Free Level Test
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
