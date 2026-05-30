import type { FC } from 'react'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: Record<string, any>) => void
  kind: 'audio' | 'video' | 'image'
}

const LABELS: Record<Props['kind'], { url: string; title: string }> = {
  audio:  { url: 'Audio URL (mp3)',  title: 'Audio Label' },
  video:  { url: 'Video URL (mp4 / YouTube embed)', title: 'Video Label' },
  image:  { url: 'Image URL',        title: 'Image Caption' },
}

export const MediaForm: FC<Props> = ({ data, onChange, kind }) => {
  const lbl = LABELS[kind]
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
          {lbl.url}
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          value={(data.url as string) ?? ''}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
          {lbl.title} (optional)
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          value={(data.title as string) ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Label shown to student"
        />
      </div>
    </div>
  )
}
