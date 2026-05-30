import { useState, type FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { levelTestApi } from '../api'
import type { LTBlock, LTSection, CEFRLevel } from '../types'
import { QuestionSlotEditor } from './QuestionSlotEditor'

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface Props {
  blocks: LTBlock[]
  section: LTSection
}

interface BlockFormState {
  cefr_level: CEFRLevel
  audio_path: string
  passage_ar: string
  passage_en: string
}

const DEFAULT_FORM: BlockFormState = {
  cefr_level: 'A2',
  audio_path: '',
  passage_ar: '',
  passage_en: '',
}

export const BlockEditor: FC<Props> = ({ blocks, section }) => {
  const qc = useQueryClient()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm] = useState<BlockFormState>(DEFAULT_FORM)

  const sectionBlocks = blocks.filter((b) => b.section === section)

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof levelTestApi.saveBlock>[0]) =>
      levelTestApi.saveBlock(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveltest-bank'] })
      setAddingNew(false)
      setNewForm(DEFAULT_FORM)
    },
  })

  const handleSaveNew = () => {
    saveMutation.mutate({
      id: 0,
      section,
      cefr_level: newForm.cefr_level,
      audio_path: section === 'listening' ? newForm.audio_path : undefined,
      passage_ar: section === 'reading' ? newForm.passage_ar : undefined,
      passage_en: section === 'reading' ? newForm.passage_en : undefined,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize text-[var(--text-1)]">
          {section} Blocks ({sectionBlocks.length})
        </h3>
        <motion.button
          whileHover={{ y: -1 }}
          onClick={() => setAddingNew(true)}
          className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add Block
        </motion.button>
      </div>

      {/* New block form */}
      <AnimatePresence>
        {addingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4"
          >
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">CEFR Level</span>
                <select
                  value={newForm.cefr_level}
                  onChange={(e) => setNewForm((p) => ({ ...p, cefr_level: e.target.value as CEFRLevel }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>

              {section === 'listening' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">Audio Path</span>
                  <input
                    value={newForm.audio_path}
                    onChange={(e) => setNewForm((p) => ({ ...p, audio_path: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    placeholder="assets/audio/leveltest/…"
                  />
                </label>
              )}

              {section === 'reading' && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">Arabic Passage *</span>
                    <textarea
                      rows={4}
                      value={newForm.passage_ar}
                      onChange={(e) => setNewForm((p) => ({ ...p, passage_ar: e.target.value }))}
                      dir="rtl"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-1)]">English Passage</span>
                    <textarea
                      rows={3}
                      value={newForm.passage_en}
                      onChange={(e) => setNewForm((p) => ({ ...p, passage_en: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </label>
                </>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ y: -1 }}
                  disabled={saveMutation.isPending}
                  onClick={handleSaveNew}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save Block'}
                </motion.button>
                <button
                  onClick={() => { setAddingNew(false); setNewForm(DEFAULT_FORM) }}
                  className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-2)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sectionBlocks.map((block) => (
        <div
          key={block.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)]"
        >
          <button
            className="flex w-full items-center justify-between p-4 text-start"
            onClick={() => setExpandedId(expandedId === block.id ? null : block.id)}
          >
            <span className="font-medium text-[var(--text-1)]">
              Block {block.block_number} — {block.cefr_level}
              <span className="ms-2 text-xs text-[var(--text-3)]">
                {block.slots.length} slot{block.slots.length !== 1 ? 's' : ''}
              </span>
            </span>
            <svg
              className={`h-4 w-4 text-[var(--text-2)] transition-transform ${expandedId === block.id ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {expandedId === block.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-[var(--border)]"
              >
                <div className="p-4">
                  <QuestionSlotEditor block={block} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {sectionBlocks.length === 0 && !addingNew && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-3)]">
          No {section} blocks yet.
        </div>
      )}
    </div>
  )
}
