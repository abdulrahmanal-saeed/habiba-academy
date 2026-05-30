import type { FC } from 'react'
import { BookOpen } from 'lucide-react'

interface ReadingSectionProps {
  readingText: string
  onChange: (value: string) => void
}

export const ReadingSection: FC<ReadingSectionProps> = ({ readingText, onChange }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2 mb-1">
      <BookOpen size={14} style={{ color: 'var(--accent)' }} />
      <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Reading</span>
    </div>

    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>
        Reading text (Arabic or English)
      </label>
      <textarea
        placeholder="Enter the passage the student should read…"
        value={readingText}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full rounded-xl px-3 py-2 text-sm resize-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
        dir="auto"
      />
    </div>
  </div>
)
