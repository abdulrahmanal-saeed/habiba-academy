import { useState } from 'react'
import type { FC } from 'react'
import type { SpeakingQuestion } from '../types'

interface SpeakingSectionFormProps {
  questions: SpeakingQuestion[]
  onChange: (questions: SpeakingQuestion[]) => void
}

const BLANK: SpeakingQuestion = {
  id: '',
  prompt: '',
  points: 20,
  sample_answer: '',
  grading_criteria: [],
}

export const SpeakingSectionForm: FC<SpeakingSectionFormProps> = ({ questions, onChange }) => {
  const [draft, setDraft] = useState<SpeakingQuestion>(() => ({ ...BLANK, id: `sp_${Date.now()}` }))
  const [criteriaInput, setCriteriaInput] = useState('')

  const addCriteria = () => {
    const v = criteriaInput.trim()
    if (!v) return
    setDraft(d => ({ ...d, grading_criteria: [...d.grading_criteria, v] }))
    setCriteriaInput('')
  }

  const removeCriteria = (idx: number) =>
    setDraft(d => ({ ...d, grading_criteria: d.grading_criteria.filter((_, i) => i !== idx) }))

  const addQuestion = () => {
    if (!draft.prompt.trim()) return
    onChange([...questions, draft])
    setDraft({ ...BLANK, id: `sp_${Date.now()}` })
    setCriteriaInput('')
  }

  const remove = (id: string) => onChange(questions.filter(q => q.id !== id))

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={q.id} className="p-3 rounded-lg bg-[var(--surface-2)] flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-1)] truncate">{i + 1}. {q.prompt}</p>
            <p className="text-xs text-[var(--text-3)] mt-0.5">{q.points} pts · {q.grading_criteria.length} criteria</p>
          </div>
          <button onClick={() => remove(q.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">Remove</button>
        </div>
      ))}

      <div className="p-3 rounded-lg border border-dashed border-[var(--border)] space-y-2">
        <p className="text-xs font-semibold text-[var(--text-2)]">New Speaking Prompt</p>
        <textarea
          className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)] resize-none"
          placeholder="Speaking prompt"
          rows={2}
          value={draft.prompt}
          onChange={e => setDraft(d => ({ ...d, prompt: e.target.value }))}
        />
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
            placeholder="Add grading criterion (e.g. Pronunciation)"
            value={criteriaInput}
            onChange={e => setCriteriaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
          />
          <button onClick={addCriteria} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] transition-colors">
            Add
          </button>
        </div>
        {draft.grading_criteria.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {draft.grading_criteria.map((c, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--text-2)]">
                {c}
                <button onClick={() => removeCriteria(i)} className="text-[var(--text-3)] hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
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
          <button
            onClick={addQuestion}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            + Add Prompt
          </button>
        </div>
      </div>
    </div>
  )
}
