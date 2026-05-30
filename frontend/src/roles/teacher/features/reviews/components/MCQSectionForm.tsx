import { useState } from 'react'
import type { FC } from 'react'
import type { MCQQuestion } from '../types'

interface MCQSectionFormProps {
  questions: MCQQuestion[]
  onChange: (questions: MCQQuestion[]) => void
}

const BLANK: MCQQuestion = {
  id: '',
  question: '',
  options: { A: '', B: '', C: '', D: '' },
  correct: 'A',
  points: 2,
}

export const MCQSectionForm: FC<MCQSectionFormProps> = ({ questions, onChange }) => {
  const [draft, setDraft] = useState<MCQQuestion>(() => ({ ...BLANK, id: `mcq_${Date.now()}` }))

  const addQuestion = () => {
    if (!draft.question.trim() || !draft.options.A.trim() || !draft.options.B.trim()) return
    onChange([...questions, draft])
    setDraft({ ...BLANK, id: `mcq_${Date.now()}` })
  }

  const remove = (id: string) => onChange(questions.filter(q => q.id !== id))

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={q.id} className="p-3 rounded-lg bg-[var(--surface-2)] flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-1)] truncate">{i + 1}. {q.question}</p>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              Correct: {q.correct} · {q.points} pts
            </p>
          </div>
          <button onClick={() => remove(q.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">Remove</button>
        </div>
      ))}

      <div className="p-3 rounded-lg border border-dashed border-[var(--border)] space-y-2">
        <p className="text-xs font-semibold text-[var(--text-2)]">New Question</p>
        <input
          className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
          placeholder="Question text"
          value={draft.question}
          onChange={e => setDraft(d => ({ ...d, question: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-2">
          {(['A', 'B', 'C', 'D'] as const).map(k => (
            <input
              key={k}
              className="text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
              placeholder={`Option ${k}`}
              value={draft.options[k] ?? ''}
              onChange={e => setDraft(d => ({ ...d, options: { ...d.options, [k]: e.target.value } }))}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-2)]">Correct:</span>
            {(['A', 'B', 'C', 'D'] as const).map(k => (
              <button
                key={k}
                onClick={() => setDraft(d => ({ ...d, correct: k }))}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                  draft.correct === k
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-[var(--text-2)]">Pts:</span>
            <input
              type="number"
              min={1}
              max={100}
              className="w-14 text-sm border border-[var(--border)] rounded-lg px-2 py-1 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
              value={draft.points}
              onChange={e => setDraft(d => ({ ...d, points: Math.max(1, parseInt(e.target.value) || 1) }))}
            />
          </div>
        </div>
        <button
          onClick={addQuestion}
          className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
        >
          + Add Question
        </button>
      </div>
    </div>
  )
}
