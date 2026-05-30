import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useAuthStore } from '@/core/stores/authStore'
import { login } from './api'

export const TeacherLoginPage: FC = () => {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore((s) => s.setAuth)

  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!password) return
    setError('')
    setLoading(true)
    try {
      await login(password)
      setAuth({ id: 1, name: 'Teacher', role: 'teacher' }, 'teacher')
      void navigate('/teacher', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <Lock size={22} color="#fff" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black" style={{ color: 'var(--fg)' }}>
              Teacher Login
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Habiba Nabil — Teacher Panel
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {error && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Enter teacher password"
                  required
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm pe-12"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--fg)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !password}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 font-bold text-sm"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !password ? 0.7 : 1,
              }}
            >
              {loading ? <Spinner size="sm" /> : 'Login'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          Student?{' '}
          <a href="/login" style={{ color: 'var(--accent)' }} className="underline underline-offset-2">
            Student login
          </a>
        </p>
      </motion.div>
    </div>
  )
}
