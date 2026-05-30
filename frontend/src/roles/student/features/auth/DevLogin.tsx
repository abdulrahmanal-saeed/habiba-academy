import { useEffect } from 'react'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useAuthStore } from '@/core/stores/authStore'

export const DevLogin: FC = () => {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    setAuth({ id: 999, name: 'Test Student', role: 'student', email: '' }, 'student')
    void navigate('/student', { replace: true })
  }, [setAuth, navigate])

  if (!import.meta.env.DEV) return null

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <Spinner size="lg" />
    </div>
  )
}
