import { useState, type FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import type { CEFRLevel, WritingTaskType, SpeakingPhase } from '../types'

const SPEAKING_PHASES: SpeakingPhase[] = ['warmup', 'description', 'discussion', 'abstract']

type PromptTab = 'writing' | 'speaking'

async function savePromptRequest(body: Record<string, string>): Promise<void> {
  const res = await fetch('/api/teacher/lt-prompt-save.php', {
    method:      'POST',
    credentials: 'include',
    body:        new URLSearchParams(body),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error ?? 'Save failed')
}

export const PromptEditor: FC = () => {
  const qc = useQueryClient()
  const [tab, setTab] = useState<PromptTab>('writing')
  const [showForm, setShowForm] = useState(false)

  const [wForm, setWForm] = useState({
    task_type:        'task1' as WritingTaskType,
    cefr_level:       'ALL'  as CEFRLevel | 'ALL',
    title:            '',
    prompt_text:      '',
    diagnostic_notes: '',
    word_range:       '',
  })

  const [sForm, setSForm] = useState({
    phase:            'warmup' as SpeakingPhase,
    target_level:     '',
    title:            '',
    prompt_text:      '',
    evaluation_notes: '',
    sort_order:       0,
  })

  const saveWriting = useMutation({
    mutationFn: () =>
      savePromptRequest({
        type:             'writing_bank',
        id:               '0',
        task_type:        wForm.task_type,
        cefr_level:       wForm.cefr_level,
        title:            wForm.title,
        prompt_text:      wForm.prompt_text,
        diagnostic_notes: wForm.diagnostic_notes,
        word_range:       wForm.word_range,
        is_active:        '1',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveltest-prompts'] })
      setShowForm(false)
      setWForm((p) => ({ ...p, title: '', prompt_text: '' }))
    },
  })

  const saveSpeaking = useMutation({
    mutationFn: () =>
      savePromptRequest({
        type:             'speaking_bank',
        id:               '0',
        phase:            sForm.phase,
        target_level:     sForm.target_level,
        title:            sForm.title,
        prompt_text:      sForm.prompt_text,
        evaluation_notes: sForm.evaluation_notes,
        sort_order:       String(sForm.sort_order),
        is_active:        '1',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveltest-prompts'] })
      setShowForm(false)
      setSForm((p) => ({ ...p, title: '', prompt_text: '' }))
    },
  })

  const activeError = tab === 'writing' ? saveWriting.error : saveSpeaking.error
  const isPending   = tab === 'writing' ? saveWriting.isPending : saveSpeaking.isPending
  const handleSave  = tab === 'writing' ? () => saveWriting.mutate() : () => saveSpeaking.mutate()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(['writing', 'speaking'] as PromptTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                tab === t
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)]'
              }`}
            >
              {t === 'writing' ? 'Writing' : 'Speaking'}
            </button>
          ))}
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add Prompt
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && tab === 'writing' && (
          <motion.div
            key="writing-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4"
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">Task Type</span>
                  <select
                    value={wForm.task_type}
                    onChange={(e) => setWForm((p) => ({ ...p, task_type: e.target.value as WritingTaskType }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="task1">Task 1 (All levels)</option>
                    <option value="task2">Task 2 (Per level)</option>
                  </select>
                </label>
                {wForm.task_type === 'task2' && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">CEFR Level</span>
                    <select
                      value={wForm.cefr_level}
                      onChange={(e) => setWForm((p) => ({ ...p, cefr_level: e.target.value as CEFRLevel }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
                    >
                      {(['A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <input
                placeholder="Title *"
                value={wForm.title}
                onChange={(e) => setWForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
              />
              <textarea
                rows={3}
                placeholder="Prompt text *"
                value={wForm.prompt_text}
                onChange={(e) => setWForm((p) => ({ ...p, prompt_text: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
              />
              <input
                placeholder="Word range (e.g. 80-120)"
                value={wForm.word_range}
                onChange={(e) => setWForm((p) => ({ ...p, word_range: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
              />
              {activeError && (
                <p className="text-xs text-red-600">{(activeError as Error).message}</p>
              )}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ y: -1 }}
                  disabled={!wForm.title || !wForm.prompt_text || isPending}
                  onClick={handleSave}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </motion.button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-2)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showForm && tab === 'speaking' && (
          <motion.div
            key="speaking-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4"
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">Phase</span>
                  <select
                    value={sForm.phase}
                    onChange={(e) => setSForm((p) => ({ ...p, phase: e.target.value as SpeakingPhase }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
                  >
                    {SPEAKING_PHASES.map((ph) => (
                      <option key={ph} value={ph}>{ph}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">Target Level</span>
                  <input
                    value={sForm.target_level}
                    onChange={(e) => setSForm((p) => ({ ...p, target_level: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
                    placeholder="B1, ALL…"
                  />
                </label>
              </div>
              <input
                placeholder="Title *"
                value={sForm.title}
                onChange={(e) => setSForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
              />
              <textarea
                rows={4}
                placeholder="Prompt text (one bullet per line) *"
                value={sForm.prompt_text}
                onChange={(e) => setSForm((p) => ({ ...p, prompt_text: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:outline-none"
              />
              {activeError && (
                <p className="text-xs text-red-600">{(activeError as Error).message}</p>
              )}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ y: -1 }}
                  disabled={!sForm.title || !sForm.prompt_text || isPending}
                  onClick={handleSave}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </motion.button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-2)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-3)]">
        Existing prompts will load here from the API.
      </div>
    </div>
  )
}
