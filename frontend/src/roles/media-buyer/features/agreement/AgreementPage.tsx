import { motion } from 'framer-motion'
import { useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useAgreement, useAcceptAgreement } from './hooks/useAgreement'

export const AgreementPage: FC = () => {
  const { data, isLoading, error } = useAgreement()
  const accept = useAcceptAgreement()
  const navigate = useNavigate()
  const [typedName, setTypedName] = useState('')

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          تعذّر تحميل الاتفاقية.
        </p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedName.trim()) return
    accept.mutate(typedName, {
      onSuccess: () => navigate('/media-buyer'),
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
        className="w-full max-w-2xl flex flex-col gap-5"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>اتفاقية ميديا باير</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            يجب قبول الاتفاقية قبل الوصول إلى لوحة التحكم
          </p>
        </div>

        <div
          className="rounded-2xl p-5 overflow-y-auto max-h-72 text-sm whitespace-pre-wrap leading-relaxed"
          style={{
            background: 'var(--surface)',
            border:     '1px solid var(--border)',
            color:      'var(--ink)',
          }}
        >
          {data.template.content}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              اكتب اسمك القانوني للتأكيد
            </label>
            <input
              type="text"
              required
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="الاسم الكامل"
              className="rounded-xl px-4 py-2.5 text-sm"
              style={{
                background: 'var(--surface)',
                border:     '1px solid var(--border)',
                color:      'var(--ink)',
              }}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!typedName.trim() || accept.isPending}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl py-3 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--surface)' }}
          >
            {accept.isPending ? 'جارٍ القبول…' : 'قبول الاتفاقية'}
          </motion.button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
          الإصدار: {data.template.version}
        </p>
      </motion.div>
    </div>
  )
}
