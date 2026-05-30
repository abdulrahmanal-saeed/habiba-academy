import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scenariosApi } from '../api'
import type { ScenarioStatus } from '../types'

interface Props {
  studentId: number
  open: boolean
  onClose: () => void
}

const INITIAL = {
  title: '',
  sc_date: '',
  publish_time: '',
  status: 'draft' as ScenarioStatus,
  situation: '',
  prompt: '',
  time_limit: 120,
  keywords: '',
  model_answer: '',
}

export const ScenarioCreateDrawer: FC<Props> = ({ studentId, open, onClose }) => {
  const qc = useQueryClient()
  const [form, setForm] = useState(INITIAL)

  const set = (k: keyof typeof INITIAL, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }))

  const mutation = useMutation({
    mutationFn: () =>
      scenariosApi.createScenario({
        student_id:   studentId,
        title:        form.title,
        sc_date:      form.sc_date,
        publish_time: form.status === 'published' ? form.publish_time : undefined,
        status:       form.status,
        situation:    form.situation || undefined,
        prompt:       form.prompt || undefined,
        time_limit:   form.time_limit,
        keywords:     form.keywords || undefined,
        model_answer: form.model_answer || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-scenarios', studentId] })
      setForm(INITIAL)
      onClose()
    },
  })

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-[var(--bg)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <h2 className="text-lg font-bold text-[var(--text-1)]">New Scenario</h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-2)] hover:bg-[var(--surface-2)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Title *</span>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="Scenario title"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Date *</span>
                  <input
                    type="date"
                    value={form.sc_date}
                    onChange={(e) => set('sc_date', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => set('status', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              </div>

              {form.status === 'published' && (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Publish Time *</span>
                  <input
                    type="time"
                    value={form.publish_time}
                    onChange={(e) => set('publish_time', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Keywords (comma-separated)</span>
                <input
                  value={form.keywords}
                  onChange={(e) => set('keywords', e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="airport, hotel, booking"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Time Limit (seconds)</span>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={form.time_limit}
                  onChange={(e) => set('time_limit', Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Situation (context)</span>
                <textarea
                  rows={3}
                  value={form.situation}
                  onChange={(e) => set('situation', e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Prompt (instructions)</span>
                <textarea
                  rows={3}
                  value={form.prompt}
                  onChange={(e) => set('prompt', e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[var(--text-1)]">Model Answer</span>
                <textarea
                  rows={3}
                  value={form.model_answer}
                  onChange={(e) => set('model_answer', e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              {mutation.isError && (
                <p className="text-sm text-red-600">Failed to create scenario. Please try again.</p>
              )}
            </div>

            <div className="border-t border-[var(--border)] p-5">
              <motion.button
                whileHover={{ y: -1 }}
                disabled={!form.title || !form.sc_date || mutation.isPending}
                onClick={() => mutation.mutate()}
                className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-50"
              >
                {mutation.isPending ? 'Creating…' : 'Create Scenario'}
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
