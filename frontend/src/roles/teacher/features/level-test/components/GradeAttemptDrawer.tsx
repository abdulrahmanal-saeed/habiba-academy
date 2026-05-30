import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { levelTestApi } from '../api'
import type { LevelTestAttempt } from '../types'

interface Props {
  attempt: LevelTestAttempt | null
  onClose: () => void
}

export const GradeAttemptDrawer: FC<Props> = ({ attempt, onClose }) => {
  const qc = useQueryClient()
  const [writingScore, setWritingScore] = useState(attempt?.writing_score ?? 0)
  const [speakingScore, setSpeakingScore] = useState(attempt?.speaking_score ?? 0)
  const [notes, setNotes] = useState(attempt?.teacher_notes ?? '')
  const [emailSent, setEmailSent] = useState(false)

  const gradeMutation = useMutation({
    mutationFn: () =>
      levelTestApi.gradeAttempt({
        attempt_id:    attempt!.id,
        writing_score: writingScore,
        speaking_score: speakingScore,
        teacher_notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveltest-attempts'] })
      onClose()
    },
  })

  const emailMutation = useMutation({
    mutationFn: () => levelTestApi.sendResultEmail(attempt!.id),
    onSuccess: () => setEmailSent(true),
  })

  const totalScore =
    (attempt?.listening_score ?? 0) +
    (attempt?.reading_score ?? 0) +
    writingScore +
    speakingScore
  const pct = Math.round((totalScore / 175) * 100)

  const levelLabel =
    pct < 40 ? 'A2' : pct < 55 ? 'B1' : pct < 70 ? 'B2' : pct < 85 ? 'C1' : 'C2'

  return (
    <AnimatePresence>
      {attempt && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            key={attempt.id}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-[var(--bg)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-1)]">{attempt.full_name}</h2>
                <p className="text-sm text-[var(--text-2)]">{attempt.created_at?.slice(0, 10)}</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-2)] hover:bg-[var(--surface-2)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Auto scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
                  <div className="text-xs text-[var(--text-2)]">Listening</div>
                  <div className="text-xl font-bold text-[var(--text-1)]">
                    {attempt.listening_score ?? '—'}<span className="text-sm font-normal">/30</span>
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
                  <div className="text-xs text-[var(--text-2)]">Reading</div>
                  <div className="text-xl font-bold text-[var(--text-1)]">
                    {attempt.reading_score ?? '—'}<span className="text-sm font-normal">/25</span>
                  </div>
                </div>
              </div>

              {/* Writing score */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-1)]">Writing Score</span>
                  <span className="text-sm font-bold text-[var(--accent)]">{writingScore}/40</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={writingScore}
                  onChange={(e) => setWritingScore(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="mt-1 flex justify-between text-xs text-[var(--text-3)]">
                  <span>0</span><span>40</span>
                </div>
              </div>

              {/* Speaking score */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-1)]">Speaking Score</span>
                  <span className="text-sm font-bold text-[var(--accent)]">{speakingScore}/80</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={speakingScore}
                  onChange={(e) => setSpeakingScore(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="mt-1 flex justify-between text-xs text-[var(--text-3)]">
                  <span>0</span><span>80</span>
                </div>
              </div>

              {/* Computed level */}
              <div className="rounded-xl bg-[var(--accent-soft)] p-4 text-center">
                <div className="text-xs text-[var(--accent)] mb-1">Estimated Level</div>
                <div className="text-3xl font-black text-[var(--accent)]">{levelLabel}</div>
                <div className="mt-1 text-sm text-[var(--accent)]">
                  {totalScore}/175 ({pct}%)
                </div>
              </div>

              {/* Teacher notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-1)]">
                  Teacher Notes
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="Optional feedback…"
                />
              </div>

              {/* Send email (only for reviewed) */}
              {attempt.review_status === 'reviewed' && attempt.email && (
                <motion.button
                  whileHover={{ y: -1 }}
                  disabled={emailMutation.isPending || emailSent}
                  onClick={() => emailMutation.mutate()}
                  className="w-full rounded-xl border border-[var(--accent)] py-2 text-sm font-medium text-[var(--accent)] disabled:opacity-50"
                >
                  {emailSent ? 'Email sent!' : emailMutation.isPending ? 'Sending…' : 'Send Result Email'}
                </motion.button>
              )}

              {gradeMutation.isError && (
                <p className="text-sm text-red-600">Failed to save. Please try again.</p>
              )}
            </div>

            <div className="border-t border-[var(--border)] p-5">
              <motion.button
                whileHover={{ y: -1 }}
                disabled={gradeMutation.isPending}
                onClick={() => gradeMutation.mutate()}
                className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-50"
              >
                {gradeMutation.isPending ? 'Saving…' : 'Save Grade'}
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
