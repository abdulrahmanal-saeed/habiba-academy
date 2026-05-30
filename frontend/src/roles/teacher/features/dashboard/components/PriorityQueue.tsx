import { useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { X, Star } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import type { PriorityItem } from '../types'

const STORAGE_KEY = 'teacher_dismissed_priority'

interface PriorityQueueProps {
  items: PriorityItem[]
}

function getDismissed(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function saveDismissed(ids: number[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export const PriorityQueue: FC<PriorityQueueProps> = ({ items }) => {
  const [dismissed, setDismissed] = useState<number[]>(() => getDismissed())

  const visible = items.filter((item) => !dismissed.includes(item.id))

  function dismiss(id: number): void {
    const next = [...dismissed, id]
    setDismissed(next)
    saveDismissed(next)
  }

  return (
    <div
      className="rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <Star size={15} style={{ color: 'var(--accent)' }} />
        <h2 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Priority Queue</h2>
        {visible.length > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ms-auto"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {visible.length}
          </span>
        )}
      </div>

      <div className="p-4">
        {visible.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
            All clear — no priority items
          </p>
        ) : (
          <motion.ul
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {visible.map((item) => (
              <motion.li
                key={item.id}
                variants={listItem}
                className="flex items-start justify-between rounded-xl px-3 py-2.5 gap-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>
                    {item.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {item.student_name}
                    {item.score !== undefined && ` · Score: ${item.score}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss"
                  className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg"
                  style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  )
}
