import type { FC } from 'react'

interface MCQQuestion {
  id: string
  question_ar: string
  question_en: string
  options: string[]
  correct: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: Record<string, any>) => void
}

const makeQ = (): MCQQuestion => ({
  id: crypto.randomUUID(),
  question_ar: '',
  question_en: '',
  options: ['', '', '', ''],
  correct: '',
})

export const MCQForm: FC<Props> = ({ data, onChange }) => {
  const title = (data.title_en as string) ?? ''
  const questions: MCQQuestion[] = Array.isArray(data.questions) ? (data.questions as MCQQuestion[]) : []

  const setQuestions = (qs: MCQQuestion[]) => onChange({ ...data, questions: qs })

  const updateQ = (idx: number, patch: Partial<MCQQuestion>) => {
    const next = questions.map((q, i) => i === idx ? { ...q, ...patch } : q)
    setQuestions(next)
  }

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const opts = [...questions[qIdx].options]
    opts[oIdx] = val
    updateQ(qIdx, { options: opts })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
          Exercise Title
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          value={title}
          onChange={(e) => onChange({ ...data, title_en: e.target.value })}
          placeholder="Choose the correct answer"
        />
      </div>

      {questions.map((q, qi) => (
        <div
          key={q.id}
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              Q{qi + 1}
            </span>
            <button
              onClick={() => setQuestions(questions.filter((_, i) => i !== qi))}
              className="text-xs"
              style={{ color: 'var(--muted)' }}
            >
              Remove
            </button>
          </div>

          <input
            dir="rtl"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            value={q.question_ar}
            onChange={(e) => updateQ(qi, { question_ar: e.target.value })}
            placeholder="السؤال..."
          />

          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${q.id}`}
                  checked={q.correct === opt && opt !== ''}
                  onChange={() => updateQ(qi, { correct: opt })}
                  className="shrink-0"
                />
                <input
                  dir="rtl"
                  className="flex-1 rounded-lg border px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  value={opt}
                  onChange={(e) => {
                    const newVal = e.target.value
                    const wasCorrect = q.correct === opt
                    updateOption(qi, oi, newVal)
                    if (wasCorrect) updateQ(qi, { options: q.options.map((o, i) => i === oi ? newVal : o), correct: newVal })
                  }}
                  placeholder={`Option ${oi + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => setQuestions([...questions, makeQ()])}
        className="w-full rounded-lg border border-dashed py-2 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        + Add Question
      </button>
    </div>
  )
}
