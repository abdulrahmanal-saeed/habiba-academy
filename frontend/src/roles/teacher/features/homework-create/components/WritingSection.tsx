import type { FC } from 'react'
import { Plus, Trash2, PenLine } from 'lucide-react'
import type { WritingQuestion } from '../types'

interface WritingSectionProps {
  questions: WritingQuestion[]
  onChange: (questions: WritingQuestion[]) => void
}

const EMPTY_Q: WritingQuestion = { prompt: '', min_sentences: 3, focus_area: '' }

export const WritingSection: FC<WritingSectionProps> = ({ questions, onChange }) => {
  function add() {
    if (questions.length >= 5) return
    onChange([...questions, { ...EMPTY_Q }])
  }

  function remove(i: number) {
    onChange(questions.filter((_, idx) => idx !== i))
  }

  function update(i: number, patch: Partial<WritingQuestion>) {
    onChange(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))
  }

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    outline: 'none',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PenLine size={14} style={{ color: 'var(--accent)' }} />
        <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Writing Prompts</span>
        <span className="text-xs ms-auto" style={{ color: 'var(--muted)' }}>{questions.length}/5</span>
      </div>

      {questions.map((q, i) => (
        <div
          key={i}
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Prompt {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Remove prompt"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <textarea
            placeholder="Writing prompt"
            value={q.prompt}
            onChange={(e) => update(i, { prompt: e.target.value })}
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={inputStyle}
            dir="auto"
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Min sentences</label>
              <input
                type="number"
                min={1}
                max={20}
                value={q.min_sentences}
                onChange={(e) => update(i, { min_sentences: Number(e.target.value) })}
                className="w-full rounded-xl px-3 py-1.5 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Focus area (optional)</label>
              <input
                type="text"
                placeholder="e.g. verb tenses"
                value={q.focus_area ?? ''}
                onChange={(e) => update(i, { focus_area: e.target.value })}
                className="w-full rounded-xl px-3 py-1.5 text-sm"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      ))}

      {questions.length < 5 && (
        <button
          type="button"
          onClick={add}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px dashed var(--accent)', cursor: 'pointer' }}
        >
          <Plus size={14} />
          Add Prompt
        </button>
      )}
    </div>
  )
}
