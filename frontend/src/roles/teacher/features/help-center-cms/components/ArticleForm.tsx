import type { FC } from 'react'
import type { HelpArticleSavePayload, HelpCategory } from '../types'
import { ROLE_OPTIONS } from '../types'

interface ArticleFormProps {
  value: HelpArticleSavePayload
  categories: HelpCategory[]
  onChange: (v: HelpArticleSavePayload) => void
}

export const ArticleForm: FC<ArticleFormProps> = ({ value, categories, onChange }) => {
  const roles = value.visible_roles.split(',').filter(Boolean)

  function toggleRole(role: string): void {
    const next = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]
    onChange({ ...value, visible_roles: next.join(',') })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Title *</label>
        <input
          className="w-full rounded-xl px-3 py-2 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Article title"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Category</label>
        <select
          className="w-full rounded-xl px-3 py-2 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
          value={value.category_id || ''}
          onChange={(e) => onChange({ ...value, category_id: Number(e.target.value) })}
        >
          <option value="">— Select category —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {/* Status + Featured row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Status</label>
          <select
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value as 'published' | 'draft' })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer pt-4">
          <input
            type="checkbox"
            checked={value.featured}
            onChange={(e) => onChange({ ...value, featured: e.target.checked })}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--accent)' }}
          />
          <span className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>Featured</span>
        </label>
      </div>

      {/* Visible roles */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Visible to</label>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className="px-3 py-1 rounded-xl text-xs font-semibold capitalize"
              style={{
                background: roles.includes(role) ? 'var(--accent)' : 'var(--surface)',
                color: roles.includes(role) ? '#fff' : 'var(--muted)',
                border: `1px solid ${roles.includes(role) ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Content</label>
        <textarea
          className="w-full rounded-xl px-3 py-2 text-sm font-mono resize-y"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none', minHeight: 180 }}
          value={value.content}
          onChange={(e) => onChange({ ...value, content: e.target.value })}
          placeholder="Article content (markdown supported)..."
        />
      </div>
    </div>
  )
}
