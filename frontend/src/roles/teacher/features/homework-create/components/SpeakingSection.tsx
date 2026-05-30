import type { FC } from 'react'
import { Plus, Trash2, Mic } from 'lucide-react'
import type { SpeakingQuestion } from '../types'

interface SpeakingSectionProps {
  questions: SpeakingQuestion[]
  onChange: (questions: SpeakingQuestion[]) => void
}

const EMPTY_Q: SpeakingQuestion = { prompt: '', time_limit: 60, tips: '' }

export const SpeakingSection: FC<SpeakingSectionProps> = ({ questions, onChange }) => {
  function add() {
    if (questions.length >= 5) return
    onChange([...questions, { ...EMPTY_Q }])
  }

  function remove(i: number) {
    onChange(questions.filter((_, idx) => idx !== i))
  }

  function update(i: number, patch: Partial<SpeakingQuestion>) {
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
        <Mic size={14} style={{ color: 'var(--accent)' }} />
        <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Speaking Prompts</span>
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
            placeholder="Speaking prompt"
            value={q.prompt}
            onChange={(e) => update(i, { prompt: e.target.value })}
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={inputStyle}
            dir="auto"
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Time limit (seconds)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={q.time_limit}
                onChange={(e) => update(i, { time_limit: Number(e.target.value) })}
                className="w-full rounded-xl px-3 py-1.5 text-sm"
                style={inputStyle}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Tips (optional)</label>
              <input
                type="text"
                placeholder="e.g. speak clearly"
                value={q.tips ?? ''}
                onChange={(e) => update(i, { tips: e.target.value })}
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
