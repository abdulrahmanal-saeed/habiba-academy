import { useState } from 'react'
import type { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BuilderSection, SectionKind } from '../types'
import { SectionTypeSelector } from './SectionTypeSelector'
import { TitleForm } from './sections/TitleForm'
import { PassageForm } from './sections/PassageForm'
import { MediaForm } from './sections/MediaForm'
import { MCQForm } from './sections/MCQForm'
import { MatchForm } from './sections/MatchForm'
import { WritingForm } from './sections/WritingForm'
import { SpeakingForm } from './sections/SpeakingForm'

const SECTION_LABELS: Record<SectionKind, string> = {
  title: 'Title / Header',
  passage: 'Reading Passage',
  audio: 'Audio',
  video: 'Video',
  image: 'Image',
  vocab: 'Vocabulary',
  grammar: 'Grammar Note',
  dialogue: 'Dialogue',
  mcq: 'MCQ Exercise',
  match: 'Matching',
  writing: 'Writing Task',
  speaking: 'Speaking Task',
}

interface Props {
  sections: BuilderSection[]
  onChange: (sections: BuilderSection[]) => void
}

const SectionForm: FC<{ section: BuilderSection; onChange: (s: BuilderSection) => void }> = ({
  section,
  onChange,
}) => {
  const update = (data: Record<string, unknown>) => onChange({ ...section, data })

  switch (section.kind) {
    case 'title':    return <TitleForm data={section.data} onChange={update} />
    case 'passage':  return <PassageForm data={section.data} onChange={update} />
    case 'audio':    return <MediaForm data={section.data} onChange={update} kind="audio" />
    case 'video':    return <MediaForm data={section.data} onChange={update} kind="video" />
    case 'image':    return <MediaForm data={section.data} onChange={update} kind="image" />
    case 'mcq':      return <MCQForm data={section.data} onChange={update} />
    case 'match':    return <MatchForm data={section.data} onChange={update} />
    case 'writing':  return <WritingForm data={section.data} onChange={update} />
    case 'speaking': return <SpeakingForm data={section.data} onChange={update} />
    default:
      return (
        <textarea
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          value={JSON.stringify(section.data, null, 2)}
          onChange={(e) => {
            try { update(JSON.parse(e.target.value) as Record<string, unknown>) } catch { /* noop */ }
          }}
        />
      )
  }
}

export const LessonBuilderForm: FC<Props> = ({ sections, onChange }) => {
  const [showSelector, setShowSelector] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const addSection = (kind: SectionKind) => {
    const newSection: BuilderSection = { id: crypto.randomUUID(), kind, data: {} }
    onChange([...sections, newSection])
    setExpanded(newSection.id)
  }

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const updateSection = (updated: BuilderSection) =>
    onChange(sections.map((s) => (s.id === updated.id ? updated : s)))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...sections]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  const moveDown = (idx: number) => {
    if (idx === sections.length - 1) return
    const next = [...sections]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {sections.map((section, idx) => (
          <motion.div
            key={section.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-xs leading-none disabled:opacity-30"
                  style={{ color: 'var(--muted)' }}
                >▲</button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === sections.length - 1}
                  className="text-xs leading-none disabled:opacity-30"
                  style={{ color: 'var(--muted)' }}
                >▼</button>
              </div>

              <button
                className="flex-1 text-start text-sm font-semibold"
                style={{ color: 'var(--text)' }}
                onClick={() => setExpanded(expanded === section.id ? null : section.id)}
              >
                <span className="text-xs font-normal mr-2" style={{ color: 'var(--muted)' }}>
                  #{idx + 1}
                </span>
                {SECTION_LABELS[section.kind]}
              </button>

              <button
                onClick={() => removeSection(section.id)}
                className="text-xs px-2 py-1 rounded-md transition-colors hover:bg-red-50 hover:text-red-500"
                style={{ color: 'var(--muted)' }}
              >
                Remove
              </button>

              <button
                onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                className="text-xs px-2 py-1"
                style={{ color: 'var(--muted)' }}
              >
                {expanded === section.id ? '▲' : '▼'}
              </button>
            </div>

            {/* Expanded form */}
            <AnimatePresence>
              {expanded === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border)' }}>
                    <SectionForm
                      section={section}
                      onChange={updateSection}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={() => setShowSelector(true)}
        className="w-full rounded-xl border border-dashed py-3 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        + Add Section
      </button>

      {showSelector && (
        <SectionTypeSelector
          onSelect={addSection}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  )
}
