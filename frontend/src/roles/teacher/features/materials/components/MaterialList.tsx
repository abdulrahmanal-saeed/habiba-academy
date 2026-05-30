import { AnimatePresence, motion } from 'framer-motion'
import type { FC } from 'react'
import type { CourseMaterial } from '../types'
import { MaterialRow } from './MaterialRow'

interface Props {
  materials: CourseMaterial[]
  isLoading: boolean
  onAdd: () => void
  onEdit: (m: CourseMaterial) => void
  onDelete: (id: number) => void
}

export const MaterialList: FC<Props> = ({ materials, isLoading, onAdd, onEdit, onDelete }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-[var(--text-2)]">
        {materials.length} material{materials.length !== 1 ? 's' : ''}
      </span>
      <motion.button
        whileHover={{ y: -1 }}
        onClick={onAdd}
        className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white"
      >
        + Add Material
      </motion.button>
    </div>

    {isLoading && (
      <div className="py-8 text-center text-sm text-[var(--text-3)]">Loading…</div>
    )}

    {!isLoading && materials.length === 0 && (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-3)]">
        No materials assigned yet.
      </div>
    )}

    <AnimatePresence initial={false}>
      {materials.map((m) => (
        <MaterialRow key={m.id} material={m} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </AnimatePresence>
  </div>
)
