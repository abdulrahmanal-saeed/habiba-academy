import { useState } from 'react'
import type { FC } from 'react'
import { YoutubePreview } from './YoutubePreview'
import type { Video, VideoSavePayload } from '../types'

interface VideoFormProps {
  video: Video | null
  onChange: (payload: VideoSavePayload) => void
}

function toPayload(v: Video | null): VideoSavePayload {
  return v ? {
    id: v.id,
    title: v.title,
    slug: v.slug,
    youtube_url: v.youtube_url,
    short_description: v.short_description ?? '',
    status: v.status,
    show_on_homepage: v.show_on_homepage,
    sort_order: v.sort_order,
  } : {
    title: '', slug: '', youtube_url: '', short_description: '',
    status: 'draft', show_on_homepage: false, sort_order: 0,
  }
}

export const VideoForm: FC<VideoFormProps> = ({ video, onChange }) => {
  const [form, setForm] = useState<VideoSavePayload>(() => toPayload(video))

  function update(patch: Partial<VideoSavePayload>): void {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      onChange(next)
      return next
    })
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--fg)', outline: 'none', borderRadius: 10,
    padding: '0.5rem 0.75rem', width: '100%', fontSize: '0.875rem',
  } as const

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>YouTube URL *</label>
        <input
          style={inputStyle}
          value={form.youtube_url}
          onChange={(e) => update({ youtube_url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <YoutubePreview url={form.youtube_url} />

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Title *</label>
        <input style={inputStyle} value={form.title} onChange={(e) => update({ title: e.target.value })} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Slug</label>
        <input style={inputStyle} value={form.slug} onChange={(e) => update({ slug: e.target.value })} placeholder="auto-generated from title" />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Short Description</label>
        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.short_description} onChange={(e) => update({ short_description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Status</label>
          <select style={inputStyle} value={form.status} onChange={(e) => update({ status: e.target.value as 'published' | 'draft' })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Sort Order</label>
          <input type="number" style={inputStyle} value={form.sort_order} onChange={(e) => update({ sort_order: Number(e.target.value) })} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.show_on_homepage} onChange={(e) => update({ show_on_homepage: e.target.checked })} className="rounded" />
        <span className="text-sm" style={{ color: 'var(--fg)' }}>Show on Homepage</span>
      </label>
    </div>
  )
}
