import type { FC } from 'react'

interface Pair {
  id: string
  left: string
  right: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: Record<string, any>) => void
}

const makePair = (): Pair => ({ id: crypto.randomUUID(), left: '', right: '' })

export const MatchForm: FC<Props> = ({ data, onChange }) => {
  const title = (data.title_en as string) ?? ''
  const pairs: Pair[] = Array.isArray(data.pairs) ? (data.pairs as Pair[]) : []

  const setPairs = (ps: Pair[]) => onChange({ ...data, pairs: ps })

  const updatePair = (idx: number, patch: Partial<Pair>) =>
    setPairs(pairs.map((p, i) => i === idx ? { ...p, ...patch } : p))

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>
          Exercise Title
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          value={title}
          onChange={(e) => onChange({ ...data, title_en: e.target.value })}
          placeholder="Match the words"
        />
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs font-medium" style={{ color: 'var(--muted)' }}>
          <span>Left (prompt)</span>
          <span>Right (answer)</span>
        </div>
        {pairs.map((pair, i) => (
          <div key={pair.id} className="grid grid-cols-2 gap-2 items-center">
            <input
              dir="rtl"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              value={pair.left}
              onChange={(e) => updatePair(i, { left: e.target.value })}
              placeholder="الكلمة"
            />
            <div className="flex gap-2 items-center">
              <input
                dir="rtl"
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={pair.right}
                onChange={(e) => updatePair(i, { right: e.target.value })}
                placeholder="المعنى"
              />
              <button
                onClick={() => setPairs(pairs.filter((_, j) => j !== i))}
                className="shrink-0 text-xs"
                style={{ color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setPairs([...pairs, makePair()])}
        className="w-full rounded-lg border border-dashed py-2 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        + Add Pair
      </button>
    </div>
  )
}
