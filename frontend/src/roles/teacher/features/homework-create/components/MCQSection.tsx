import type { FC } from 'react'
import { Plus, Trash2, HelpCircle } from 'lucide-react'
import type { MCQQuestion } from '../types'

interface MCQSectionProps {
  questions: MCQQuestion[]
  onChange: (questions: MCQQuestion[]) => void
}

const EMPTY_Q: MCQQuestion = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
}

export const MCQSection: FC<MCQSectionProps> = ({ questions, onChange }) => {
  function add() {
    if (questions.length >= 10) return
    onChange([...questions, { ...EMPTY_Q }])
  }

  function remove(i: number) {
    onChange(questions.filter((_, idx) => idx !== i))
  }

  function update(i: number, patch: Partial<MCQQuestion>) {
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
        <HelpCircle size={14} style={{ color: 'var(--accent)' }} />
        <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>MCQ Questions</span>
        <span className="text-xs ms-auto" style={{ color: 'var(--muted)' }}>{questions.length}/10</span>
      </div>

      {questions.map((q, i) => (
        <div
          key={i}
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Q{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Remove question"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <textarea
            placeholder="Question text"
            value={q.question_text}
            onChange={(e) => update(i, { question_text: e.target.value })}
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={inputStyle}
            dir="auto"
          />

          {(['a', 'b', 'c', 'd'] as const).map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${i}`}
                checked={q.correct_option === opt}
                onChange={() => update(i, { correct_option: opt })}
                style={{ accentColor: 'var(--accent)', flexShrink: 0 }}
                title={`Mark option ${opt.toUpperCase()} as correct`}
              />
              <input
                type="text"
                placeholder={`Option ${opt.toUpperCase()}${opt === 'c' || opt === 'd' ? ' (optional)' : ''}`}
                value={(q as unknown as Record<string, string>)[`option_${opt}`] ?? ''}
                onChange={(e) => update(i, { [`option_${opt}`]: e.target.value } as Partial<MCQQuestion>)}
                className="flex-1 rounded-xl px-3 py-1.5 text-sm"
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      ))}

      {questions.length < 10 && (
        <button
          type="button"
          onClick={add}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px dashed var(--accent)', cursor: 'pointer' }}
        >
          <Plus size={14} />
          Add Question
        </button>
      )}
    </div>
  )
}
