import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import type { FC } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Spinner } from '@/design-system/components'
import { getFlashcards, reviewCard } from './api'
import { FlashCard } from './components/FlashCard'
import { ReviewButtons } from './components/ReviewButtons'
import { DoneState } from './components/DoneState'
import type { ReviewState } from './types'

export const FlashcardsPage: FC = () => {
  const [idx, setIdx]           = useState(0)
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const { data: cards, isLoading, error: loadError } = useQuery({
    queryKey: ['student-flashcards'],
    queryFn: getFlashcards,
  })

  const handleRate = useCallback(
    async (state: ReviewState) => {
      if (!cards || idx >= cards.length) return
      const card = cards[idx]
      setSubmit(true)
      setError(null)
      try {
        await reviewCard(card.card_type, card.id, state)
        setIdx((i) => i + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save review.')
      } finally {
        setSubmit(false)
      }
    },
    [cards, idx],
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (loadError || !cards) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          Failed to load flashcards. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-4">

        <h1 className="font-extrabold text-2xl" style={{ color: 'var(--fg)' }}>
          Flashcards
        </h1>
        <p className="text-sm -mt-2" style={{ color: 'var(--muted)' }}>
          Review due words and mistakes using spaced repetition.
        </p>

        <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
          Got it = 3 days · Almost = tomorrow · Missed = today
        </div>

        <AnimatePresence mode="wait">
          {cards.length === 0 || idx >= cards.length ? (
            <DoneState
              key="done"
              message={cards.length === 0 ? 'No cards due now.' : 'Done for now.'}
            />
          ) : (
            <div key={idx}>
              <FlashCard card={cards[idx]} index={idx} total={cards.length} />

              {error && (
                <p className="text-sm text-center mt-3" style={{ color: 'var(--danger)' }}>
                  {error}
                </p>
              )}

              <ReviewButtons onRate={handleRate} disabled={submitting} />
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
