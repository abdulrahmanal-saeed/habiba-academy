import type { FC } from 'react'
import { Headphones } from 'lucide-react'

interface ListeningSectionProps {
  mediaUrl: string
  mediaInstructions: string
  onChange: (field: 'media_url' | 'media_instructions', value: string) => void
}

export const ListeningSection: FC<ListeningSectionProps> = ({ mediaUrl, mediaInstructions, onChange }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2 mb-1">
      <Headphones size={14} style={{ color: 'var(--accent)' }} />
      <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Listening</span>
    </div>

    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>
        Media URL (YouTube or audio link)
      </label>
      <input
        type="url"
        placeholder="https://youtube.com/..."
        value={mediaUrl}
        onChange={(e) => onChange('media_url', e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-sm"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
      />
    </div>

    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>
        Instructions (optional)
      </label>
      <textarea
        placeholder="What should the student do while listening?"
        value={mediaInstructions}
        onChange={(e) => onChange('media_instructions', e.target.value)}
        rows={3}
        className="w-full rounded-xl px-3 py-2 text-sm resize-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
      />
    </div>
  </div>
)
