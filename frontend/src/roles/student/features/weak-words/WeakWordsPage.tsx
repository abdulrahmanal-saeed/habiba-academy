import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { stagger, fadeInUp } from '@/design-system/animations'
import { getWeakWords } from './api'
import { WeakWordCard } from './components/WeakWordCard'

export const WeakWordsPage: FC = () => {
  const { data: words, isLoading, error } = useQuery({
    queryKey: ['student-weak-words'],
    queryFn: getWeakWords,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !words) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          Failed to load weak words. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <h1 className="font-extrabold text-2xl" style={{ color: 'var(--fg)' }}>
            Weak Words
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Words your teacher flagged for extra practice. Mark them once you feel confident.
          </p>
        </motion.div>

        {words.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <span className="text-5xl">🎉</span>
            <p className="font-semibold text-lg" style={{ color: 'var(--fg)' }}>
              No weak words assigned yet.
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Words your teacher adds will appear here for practice.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {words.map((word) => (
              <WeakWordCard key={word.id} word={word} />
            ))}
          </motion.div>
        )}

      </div>
    </div>
  )
}
