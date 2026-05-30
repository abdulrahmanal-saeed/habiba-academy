import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cardVariant } from '@/design-system/animations'
import { toggleWeakWord } from '../api'
import type { WeakWord } from '../types'

interface WeakWordCardProps {
  word: WeakWord
}

export const WeakWordCard: FC<WeakWordCardProps> = ({ word }) => {
  const queryClient             = useQueryClient()
  const [mastered, setMastered] = useState(word.is_mastered === 1)
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleToggle(): Promise<void> {
    const next = mastered ? 0 : 1
    setMastered(next === 1)
    setLoading(true)
    try {
      const confirmed = await toggleWeakWord(word.id, next)
      setMastered(confirmed === 1)
      void queryClient.invalidateQueries({ queryKey: ['student-weak-words'] })
    } catch {
      setMastered(!mastered)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        opacity: mastered ? 0.65 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Word + toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div
            className="text-2xl font-black leading-snug"
            style={{ color: 'var(--accent)', direction: 'rtl' }}
          >
            {word.word}
          </div>
          {word.note && (
            <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {word.note}
            </div>
          )}
          {mastered && (
            <span
              className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
            >
              <Check size={10} /> Mastered ✓
            </span>
          )}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          disabled={loading}
          aria-label={mastered ? 'Mark as not mastered' : 'Mark as mastered'}
          className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={
            mastered
              ? { background: 'var(--success)', color: '#fff' }
              : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }
          }
        >
          {mastered ? '✓' : 'Got it'}
        </motion.button>
      </div>

      {/* Guidance accordion */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-expanded={open}
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            <ChevronDown size={13} />
          </motion.span>
          {open ? 'Hide guidance' : 'Show guidance'}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="guidance"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div
                className="mt-3 rounded-xl p-3 flex flex-col gap-2"
                style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-soft)' }}
              >
                {word.guidance.meaning_en && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)' }}>
                    {word.guidance.meaning_en}
                  </p>
                )}
                {word.guidance.practice_prompt_en && (
                  <p
                    className="text-xs font-semibold px-2 py-1.5 rounded-lg"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    ✏️ {word.guidance.practice_prompt_en}
                  </p>
                )}
                {word.guidance.student_action_en && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {word.guidance.student_action_en}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
