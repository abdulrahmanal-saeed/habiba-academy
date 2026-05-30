import { motion } from 'framer-motion'
import type { FC, ChangeEvent } from 'react'
import { Search } from 'lucide-react'
import { fadeIn } from '@/design-system/animations'
import { MATERIAL_TYPES, MATERIAL_CATEGORIES } from '../utils'
import type { MaterialType } from '../types'

export interface FiltersState {
  text: string
  type: MaterialType | ''
  category: string
}

export interface MaterialFiltersProps {
  filters: FiltersState
  onChange: (next: FiltersState) => void
}

export const MaterialFilters: FC<MaterialFiltersProps> = ({ filters, onChange }) => {
  function set<K extends keyof FiltersState>(key: K, value: FiltersState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-xl p-4 flex flex-wrap gap-3 items-center"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="relative flex-1 min-w-[160px]">
        <span className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={14} style={{ color: 'var(--muted)' }} />
        </span>
        <input
          type="search"
          value={filters.text}
          onChange={(e: ChangeEvent<HTMLInputElement>) => set('text', e.target.value)}
          placeholder="Search materials…"
          className="w-full rounded-lg text-sm py-2 ps-8 pe-3 outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        />
      </div>

      <select
        value={filters.type}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => set('type', e.target.value as MaterialType | '')}
        className="rounded-lg text-sm py-2 px-3 outline-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
      >
        <option value="">All types</option>
        {(Object.entries(MATERIAL_TYPES) as [MaterialType, string][]).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => set('category', e.target.value)}
        className="rounded-lg text-sm py-2 px-3 outline-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
      >
        <option value="">All categories</option>
        {Object.entries(MATERIAL_CATEGORIES).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </motion.div>
  )
}
