import { useState, useRef, type ChangeEvent } from 'react'
import type { FC } from 'react'
import { ImageOff } from 'lucide-react'
import type { Article, ArticleSavePayload } from '../types'

interface ArticleFormProps {
  article: Article | null
  onChange: (payload: ArticleSavePayload, coverFile: File | null) => void
}

function toPayload(a: Article | null): ArticleSavePayload {
  return a ? {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt ?? '',
    body: a.body ?? '',
    status: a.status,
    show_on_homepage: a.show_on_homepage,
    sort_order: a.sort_order,
    meta_title: a.meta_title ?? '',
    meta_description: a.meta_description ?? '',
    existing_cover_image: a.cover_image ?? '',
  } : {
    title: '', slug: '', excerpt: '', body: '',
    status: 'draft', show_on_homepage: false, sort_order: 0,
    meta_title: '', meta_description: '', existing_cover_image: '',
  }
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export const ArticleForm: FC<ArticleFormProps> = ({ article, onChange }) => {
  const [form, setForm] = useState<ArticleSavePayload>(() => toPayload(article))
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<File | null>(null)

  function update(patch: Partial<ArticleSavePayload>): void {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      onChange(next, coverFileRef.current)
      return next
    })
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (!file) return
    coverFileRef.current = file
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    onChange(form, file)
  }

  const existingCoverSrc = form.existing_cover_image
    ? `${baseUrl}/${form.existing_cover_image}` : null
  const coverSrc = preview ?? existingCoverSrc

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--fg)', outline: 'none', borderRadius: 10,
    padding: '0.5rem 0.75rem', width: '100%', fontSize: '0.875rem',
  } as const

  return (
    <div className="flex flex-col gap-3">
      {/* Cover */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Cover Image</label>
        <div
          className="relative rounded-xl overflow-hidden flex items-center justify-center cursor-pointer"
          style={{ height: 120, background: 'var(--surface)', border: '1px dashed var(--border)' }}
          onClick={() => fileRef.current?.click()}
        >
          {coverSrc
            ? <img src={coverSrc} alt="Cover" className="w-full h-full object-cover" />
            : <ImageOff size={24} style={{ color: 'var(--muted)' }} />
          }
          <div
            className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <span className="text-white text-xs font-semibold">Change Cover</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Title *</label>
        <input style={inputStyle} value={form.title} onChange={(e) => update({ title: e.target.value })} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Slug</label>
        <input style={inputStyle} value={form.slug} onChange={(e) => update({ slug: e.target.value })} placeholder="auto-generated from title" />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Excerpt</label>
        <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Body *</label>
        <textarea rows={6} style={{ ...inputStyle, resize: 'vertical' }} value={form.body} onChange={(e) => update({ body: e.target.value })} />
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

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Meta Title</label>
        <input style={inputStyle} value={form.meta_title} onChange={(e) => update({ meta_title: e.target.value })} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Meta Description</label>
        <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.meta_description} onChange={(e) => update({ meta_description: e.target.value })} />
      </div>
    </div>
  )
}
