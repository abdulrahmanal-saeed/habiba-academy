import type { FC } from 'react'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: Record<string, any>) => void
}

export const WritingForm: FC<Props> = ({ data, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
        Prompt (AR)
      </label>
      <textarea
        dir="rtl"
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        value={(data.prompt_ar as string) ?? ''}
        onChange={(e) => onChange({ ...data, prompt_ar: e.target.value })}
        placeholder="اكتب عن..."
      />
    </div>
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
        Prompt (EN) — optional
      </label>
      <textarea
        rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        value={(data.prompt_en as string) ?? ''}
        onChange={(e) => onChange({ ...data, prompt_en: e.target.value })}
        placeholder="Write about..."
      />
    </div>
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
        Minimum sentences required
      </label>
      <input
        type="number"
        min={1}
        max={20}
        className="w-32 rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        value={(data.min_sentences as number) ?? 3}
        onChange={(e) => onChange({ ...data, min_sentences: Number(e.target.value) })}
      />
    </div>
  </div>
)
