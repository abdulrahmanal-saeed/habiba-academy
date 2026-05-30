import { useState, type FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { levelTestApi } from '../api'
import type { LTBlock, LTQuestion } from '../types'

interface Props {
  block: LTBlock
}

interface QuestionForm {
  question_ar: string
  question_en: string
  opt_a_ar: string
  opt_b_ar: string
  opt_c_ar: string
  opt_d_ar: string
  correct_opt: 'A' | 'B' | 'C' | 'D'
}

const EMPTY_FORM: QuestionForm = {
  question_ar: '',
  question_en: '',
  opt_a_ar: '',
  opt_b_ar: '',
  opt_c_ar: '',
  opt_d_ar: '',
  correct_opt: 'A',
}

export const QuestionSlotEditor: FC<Props> = ({ block }) => {
  const qc = useQueryClient()
  const [addingToSlot, setAddingToSlot] = useState<number | null>(null)
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM)

  const set = (k: keyof QuestionForm, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  const addMutation = useMutation({
    mutationFn: (itemNumber: number) =>
      levelTestApi.saveQuestion({
        id: 0,
        block_id: block.id,
        item_number: itemNumber,
        ...form,
        is_active: 1,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveltest-bank'] })
      setAddingToSlot(null)
      setForm(EMPTY_FORM)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => levelTestApi.deleteQuestion(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['leveltest-bank'] }),
  })

  const nextSlot = block.slots.length > 0
    ? Math.max(...block.slots.map((s) => s.item_number)) + 1
    : 1

  return (
    <div className="space-y-3">
      {block.slots.map((slot) => (
        <div key={slot.item_number} className="rounded-lg bg-[var(--surface-2)] p-3">
          <div className="mb-2 text-xs font-semibold text-[var(--text-2)]">
            Slot {slot.item_number} · {slot.variants.length} variant{slot.variants.length !== 1 ? 's' : ''}
          </div>

          {slot.variants.map((q: LTQuestion) => (
            <div key={q.id} className="mb-2 flex items-start justify-between gap-2 rounded-lg bg-[var(--surface-1)] p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-1)]" dir="rtl">{q.question_ar}</p>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {(['A', 'B', 'C', 'D'] as const).filter((opt) => {
                    const key = `opt_${opt.toLowerCase()}_ar` as keyof LTQuestion
                    return q[key]
                  }).map((opt) => {
                    const key = `opt_${opt.toLowerCase()}_ar` as keyof LTQuestion
                    return (
                      <span
                        key={opt}
                        className={`rounded text-xs px-2 py-0.5 ${q.correct_opt === opt ? 'bg-green-100 text-green-700 font-semibold' : 'text-[var(--text-2)]'}`}
                      >
                        {opt}: {q[key] as string}
                      </span>
                    )
                  })}
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(q.id)}
                className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <button
            onClick={() => { setAddingToSlot(slot.item_number); setForm(EMPTY_FORM) }}
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            + Add variant
          </button>
        </div>
      ))}

      {/* Add new slot */}
      <motion.button
        whileHover={{ y: -1 }}
        onClick={() => { setAddingToSlot(nextSlot); setForm(EMPTY_FORM) }}
        className="w-full rounded-lg border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        + Add Question Slot {nextSlot}
      </motion.button>

      {/* Add variant form */}
      <AnimatePresence>
        {addingToSlot !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4"
          >
            <p className="mb-3 text-xs font-semibold text-[var(--accent)]">
              Slot {addingToSlot} — New variant
            </p>
            <div className="space-y-2">
              <textarea
                rows={2}
                dir="rtl"
                placeholder="Question (Arabic) *"
                value={form.question_ar}
                onChange={(e) => set('question_ar', e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
              {(['a', 'b', 'c'] as const).map((opt) => (
                <input
                  key={opt}
                  placeholder={`Option ${opt.toUpperCase()} (Arabic) *`}
                  value={form[`opt_${opt}_ar` as keyof QuestionForm]}
                  onChange={(e) => set(`opt_${opt}_ar` as keyof QuestionForm, e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              ))}
              <input
                placeholder="Option D (Arabic, optional)"
                value={form.opt_d_ar}
                onChange={(e) => set('opt_d_ar', e.target.value)}
                dir="rtl"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[var(--text-1)]">Correct:</label>
                <select
                  value={form.correct_opt}
                  onChange={(e) => set('correct_opt', e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1 text-sm focus:outline-none"
                >
                  {(['A', 'B', 'C', 'D'] as const).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <motion.button
                  whileHover={{ y: -1 }}
                  disabled={!form.question_ar || !form.opt_a_ar || !form.opt_b_ar || !form.opt_c_ar || addMutation.isPending}
                  onClick={() => addMutation.mutate(addingToSlot)}
                  className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Saving…' : 'Save'}
                </motion.button>
                <button
                  onClick={() => setAddingToSlot(null)}
                  className="rounded-lg bg-[var(--surface-2)] px-4 py-1.5 text-sm font-medium text-[var(--text-2)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
