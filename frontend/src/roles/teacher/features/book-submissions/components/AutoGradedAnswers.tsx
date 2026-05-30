import type { FC } from 'react'
import type { BookAnswerItem, BookAnswers } from '../types'

const TEXT_ONLY = new Set([
  'writing_task', 'writing_tasks', 'speaking_task', 'speaking_tasks',
  'complete_sentence', 'complete_conversation',
])

const isAutoGraded = (key: string, val: unknown): val is BookAnswerItem[] =>
  !TEXT_ONLY.has(key) &&
  Array.isArray(val) &&
  val.length > 0 &&
  typeof (val as BookAnswerItem[])[0]?.is_correct === 'boolean'

const humanize = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

interface Props {
  answers: BookAnswers
}

export const AutoGradedAnswers: FC<Props> = ({ answers }) => {
  const groups = Object.entries(answers).filter(([k, v]) => isAutoGraded(k, v)) as [
    string,
    BookAnswerItem[],
  ][]

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--text-3)]">No auto-graded exercises in this submission.</p>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map(([key, items]) => (
        <div key={key}>
          <h4 className="mb-2 text-sm font-semibold text-[var(--text-1)]">{humanize(key)}</h4>
          <div className="space-y-1">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--text-2)]" dir="rtl">
                  {item.question_id}: {item.answer}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.is_correct
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.is_correct ? 'Correct' : 'Wrong'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
