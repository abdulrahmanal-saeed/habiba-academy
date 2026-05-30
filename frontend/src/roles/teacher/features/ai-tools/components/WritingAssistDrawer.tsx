import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Sparkles } from 'lucide-react'
import { aiToolsApi } from '../api'
import type { AIWritingAssist, WritingAssistPayload } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  payload: WritingAssistPayload
  onApplyFeedback?: (feedback: string) => void
}

export const WritingAssistDrawer: FC<Props> = ({ open, onClose, payload, onApplyFeedback }) => {
  const [result, setResult] = useState<AIWritingAssist | null>(null)

  const mutation = useMutation({
    mutationFn: () => aiToolsApi.getWritingAssist(payload),
    onSuccess: (data) => setResult(data.assist),
  })

  function handleOpen() {
    if (!result) mutation.mutate()
  }

  return (
    <AnimatePresence onExitComplete={() => setResult(null)}>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
          <motion.aside
            key="writing-assist"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onAnimationComplete={handleOpen}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-[var(--bg)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Writing Assist</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2" style={{ color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {mutation.isPending && (
                <div className="flex items-center justify-center py-10 gap-3">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  <span className="text-sm" style={{ color: 'var(--text-3)' }}>Analysing…</span>
                </div>
              )}

              {result && (
                <>
                  <ConfBlock label="Summary">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{result.summary}</p>
                    <span className="text-xs mt-1 block" style={{ color: 'var(--text-3)' }}>Confidence: {Math.round(result.confidence * 100)}%</span>
                  </ConfBlock>

                  {result.possible_issues.length > 0 && (
                    <ConfBlock label="Possible Issues">
                      <ul className="space-y-1">
                        {result.possible_issues.map((iss, i) => (
                          <li key={i} className="text-sm flex items-start gap-1.5" style={{ color: 'var(--text-1)' }}>
                            <span style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0 }}>•</span>{iss}
                          </li>
                        ))}
                      </ul>
                    </ConfBlock>
                  )}

                  {result.suggested_feedback && (
                    <ConfBlock label="Suggested Feedback">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{result.suggested_feedback}</p>
                      {onApplyFeedback && (
                        <motion.button
                          type="button"
                          whileHover={{ y: -1 }}
                          onClick={() => { onApplyFeedback(result.suggested_feedback); onClose() }}
                          className="mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
                          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          Apply to Feedback Field
                        </motion.button>
                      )}
                    </ConfBlock>
                  )}

                  {result.suggested_correction && (
                    <ConfBlock label="Suggested Correction">
                      <p className="text-sm leading-relaxed" dir="rtl" style={{ color: 'var(--text-1)' }}>{result.suggested_correction}</p>
                    </ConfBlock>
                  )}
                </>
              )}
            </div>

            {result && (
              <div className="border-t border-[var(--border)] p-5">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  onClick={() => { setResult(null); mutation.mutate() }}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)', cursor: 'pointer' }}
                >
                  Re-analyse
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function ConfBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-3)' }}>{label}</div>
      {children}
    </div>
  )
}
