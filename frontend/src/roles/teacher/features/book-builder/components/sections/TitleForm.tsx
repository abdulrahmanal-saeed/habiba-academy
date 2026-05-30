import type { FC } from 'react'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: Record<string, any>) => void
}

export const TitleForm: FC<Props> = ({ data, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
        Title (EN)
      </label>
      <input
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        value={(data.title_en as string) ?? ''}
        onChange={(e) => onChange({ ...data, title_en: e.target.value })}
        placeholder="Section title"
      />
    </div>
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
        Title (AR)
      </label>
      <input
        dir="rtl"
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        value={(data.title_ar as string) ?? ''}
        onChange={(e) => onChange({ ...data, title_ar: e.target.value })}
        placeholder="عنوان القسم"
      />
    </div>
  </div>
)
