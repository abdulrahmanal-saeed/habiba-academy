import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { stagger, fadeInUp } from '@/design-system/animations'
import { getCommonMistakes } from './api'
import { MistakeCard } from './components/MistakeCard'

export const CommonMistakesPage: FC = () => {
  const { data: mistakes, isLoading, error } = useQuery({
    queryKey: ['student-common-mistakes'],
    queryFn: getCommonMistakes,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !mistakes) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          Failed to load common mistakes. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <h1 className="font-extrabold text-2xl" style={{ color: 'var(--fg)' }}>
            Common Mistakes
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Recurring patterns your teacher wants you to understand and fix.
          </p>
        </motion.div>

        {mistakes.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <span className="text-5xl">🎉</span>
            <p className="font-semibold text-lg" style={{ color: 'var(--fg)' }}>
              No common mistakes recorded yet.
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Mistakes your teacher logs will appear here with practice guidance.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {mistakes.map((mistake) => (
              <MistakeCard key={mistake.id} mistake={mistake} />
            ))}
          </motion.div>
        )}

      </div>
    </div>
  )
}
