import type { FC } from 'react'
import type { SectionKind } from '../types'

interface Option {
  kind: SectionKind
  label: string
  icon: string
}

const OPTIONS: Option[] = [
  { kind: 'title',    label: 'Title / Header',  icon: 'H' },
  { kind: 'passage',  label: 'Reading Passage', icon: '¶' },
  { kind: 'audio',    label: 'Audio',           icon: '♪' },
  { kind: 'video',    label: 'Video',           icon: '▶' },
  { kind: 'image',    label: 'Image',           icon: '🖼' },
  { kind: 'vocab',    label: 'Vocabulary',      icon: 'V' },
  { kind: 'grammar',  label: 'Grammar Note',    icon: 'G' },
  { kind: 'dialogue', label: 'Dialogue',        icon: 'D' },
  { kind: 'mcq',      label: 'MCQ Exercise',    icon: '☑' },
  { kind: 'match',    label: 'Matching',        icon: '↔' },
  { kind: 'writing',  label: 'Writing Task',    icon: '✎' },
  { kind: 'speaking', label: 'Speaking Task',   icon: '🎤' },
]

interface SectionTypeSelectorProps {
  onSelect: (kind: SectionKind) => void
  onClose: () => void
}

export const SectionTypeSelector: FC<SectionTypeSelectorProps> = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
    <div
      className="w-full max-w-md rounded-2xl p-6 shadow-xl"
      style={{ background: 'var(--card)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="mb-4 text-lg font-bold" style={{ color: 'var(--text)' }}>
        Add Section
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.kind}
            onClick={() => { onSelect(opt.kind); onClose() }}
            className="flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <span className="text-xl">{opt.icon}</span>
            <span className="text-center text-xs leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
)
