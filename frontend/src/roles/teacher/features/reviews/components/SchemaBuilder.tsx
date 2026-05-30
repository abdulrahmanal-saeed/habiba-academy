import { useState } from 'react'
import type { FC } from 'react'
import type { ReviewSchema, ReviewSection, SectionId, MCQQuestion, WritingQuestion, SpeakingQuestion } from '../types'
import { MCQSectionForm } from './MCQSectionForm'
import { WritingSectionForm } from './WritingSectionForm'
import { SpeakingSectionForm } from './SpeakingSectionForm'

interface SchemaBuilderProps {
  schema: ReviewSchema
  onChange: (schema: ReviewSchema) => void
}

const SECTION_OPTIONS: { id: SectionId; label: string; auto: boolean }[] = [
  { id: 'mcq',           label: 'Multiple Choice',  auto: true },
  { id: 'fill_the_blank',label: 'Fill in the Blank', auto: true },
  { id: 'writing',       label: 'Writing',           auto: false },
  { id: 'speaking',      label: 'Speaking',          auto: false },
  { id: 'scenario',      label: 'Scenario',          auto: false },
]

const makeSection = (id: SectionId): ReviewSection => {
  const opt = SECTION_OPTIONS.find(o => o.id === id)!
  const base: ReviewSection = {
    section_id: id,
    title: opt.label,
    auto_gradable: opt.auto,
    total_points: 20,
  }
  if (id === 'mcq' || id === 'fill_the_blank' || id === 'writing' || id === 'speaking') {
    base.questions = []
  }
  if (id === 'matching') {
    base.exercises = []
  }
  if (id === 'scenario') {
    base.scenarios = []
  }
  return base
}

export const SchemaBuilder: FC<SchemaBuilderProps> = ({ schema, onChange }) => {
  const [open, setOpen] = useState<string | null>(null)

  const addSection = (id: SectionId) => {
    if (schema.sections.some(s => s.section_id === id)) return
    onChange({ ...schema, sections: [...schema.sections, makeSection(id)] })
  }

  const removeSection = (id: string) => {
    onChange({ ...schema, sections: schema.sections.filter(s => s.section_id !== id) })
    if (open === id) setOpen(null)
  }

  const updateSection = (id: string, updated: Partial<ReviewSection>) => {
    onChange({
      ...schema,
      sections: schema.sections.map(s => s.section_id === id ? { ...s, ...updated } : s),
    })
  }

  const usedIds = new Set(schema.sections.map(s => s.section_id))

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-[var(--text-2)] mb-2">Add Section</p>
        <div className="flex flex-wrap gap-2">
          {SECTION_OPTIONS.map(opt => (
            <button
              key={opt.id}
              disabled={usedIds.has(opt.id)}
              onClick={() => addSection(opt.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                usedIds.has(opt.id)
                  ? 'border-[var(--border)] text-[var(--text-3)] opacity-50 cursor-not-allowed'
                  : 'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
              }`}
            >
              + {opt.label}
            </button>
          ))}
        </div>
      </div>

      {schema.sections.length === 0 && (
        <p className="text-sm text-[var(--text-3)] text-center py-4">No sections yet. Add one above.</p>
      )}

      {schema.sections.map(section => (
        <div key={section.section_id} className="rounded-xl border border-[var(--border)] overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
            onClick={() => setOpen(open === section.section_id ? null : section.section_id)}
          >
            <span className="text-sm font-medium text-[var(--text-1)]">{section.title}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-3)]">{section.total_points} pts</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${section.auto_gradable ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                {section.auto_gradable ? 'Auto' : 'Manual'}
              </span>
              <span className="text-[var(--text-3)]">{open === section.section_id ? '▲' : '▼'}</span>
            </div>
          </button>

          {open === section.section_id && (
            <div className="p-4 space-y-3 bg-[var(--surface-1)]">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-[var(--text-2)]">Section Title</label>
                  <input
                    className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 mt-1 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                    value={section.title}
                    onChange={e => updateSection(section.section_id, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-2)]">Total Points</label>
                  <input
                    type="number"
                    min={1}
                    className="w-20 text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 mt-1 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                    value={section.total_points}
                    onChange={e => updateSection(section.section_id, { total_points: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>
              </div>

              {section.section_id === 'mcq' && (
                <MCQSectionForm
                  questions={(section.questions as MCQQuestion[]) ?? []}
                  onChange={qs => updateSection(section.section_id, { questions: qs })}
                />
              )}

              {section.section_id === 'writing' && (
                <WritingSectionForm
                  questions={(section.questions as WritingQuestion[]) ?? []}
                  onChange={qs => updateSection(section.section_id, { questions: qs })}
                />
              )}

              {section.section_id === 'speaking' && (
                <SpeakingSectionForm
                  questions={(section.questions as SpeakingQuestion[]) ?? []}
                  onChange={qs => updateSection(section.section_id, { questions: qs })}
                />
              )}

              {(section.section_id === 'fill_the_blank' || section.section_id === 'scenario' || section.section_id === 'matching') && (
                <p className="text-xs text-[var(--text-3)] italic">
                  {section.section_id === 'fill_the_blank' && 'Fill-in-the-blank questions can be added via JSON editor.'}
                  {section.section_id === 'matching' && 'Matching exercises can be added via JSON editor.'}
                  {section.section_id === 'scenario' && 'Scenario steps can be added via JSON editor.'}
                </p>
              )}

              <button
                onClick={() => removeSection(section.section_id)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remove section
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
