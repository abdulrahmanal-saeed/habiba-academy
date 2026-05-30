import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag } from 'lucide-react'
import { aiToolsApi } from '../api'
import type { MistakeSuggestion } from '../types'

interface Props {
  studentId: number
  onTagsSelected?: (tags: MistakeSuggestion[]) => void
}

const fieldCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'

export const MistakeTagsInput: FC<Props> = ({ studentId, onTagsSelected }) => {
  const [text, setText]           = useState('')
  const [selected, setSelected]   = useState<Set<number>>(new Set())

  const mutation = useMutation({
    mutationFn: () => aiToolsApi.getMistakeTags(studentId, text),
  })

  const suggestions = mutation.data?.suggestions ?? []

  function toggleTag(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function applySelected() {
    const picked = suggestions.filter((s) => selected.has(s.taxonomy_id))
    onTagsSelected?.(picked)
    setSelected(new Set())
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <textarea
          className={fieldCls}
          rows={2}
          placeholder="Paste the student's answer to detect mistake patterns…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          dir="rtl"
        />
      </div>

      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        disabled={mutation.isPending || !text.trim()}
        onClick={() => mutation.mutate()}
        className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'pointer', opacity: (!text.trim() || mutation.isPending) ? 0.5 : 1 }}
      >
        <Tag size={13} />
        {mutation.isPending ? 'Detecting…' : 'Detect Mistakes'}
      </motion.button>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {suggestions.map((s) => (
              <button
                key={s.taxonomy_id}
                type="button"
                onClick={() => toggleTag(s.taxonomy_id)}
                className="flex items-start justify-between gap-2 rounded-xl p-3 text-start"
                style={{
                  background: selected.has(s.taxonomy_id) ? 'var(--accent-soft)' : 'var(--surface)',
                  border: `1px solid ${selected.has(s.taxonomy_id) ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{s.label_en}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label_ar} · {s.reason}</p>
                </div>
                <span className="text-xs font-mono flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>
                  {Math.round(s.confidence * 100)}%
                </span>
              </button>
            ))}

            {selected.size > 0 && (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                onClick={applySelected}
                className="rounded-xl py-2 text-sm font-semibold"
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Apply {selected.size} tag{selected.size > 1 ? 's' : ''}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
