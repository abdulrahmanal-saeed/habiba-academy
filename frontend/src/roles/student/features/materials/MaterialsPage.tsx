import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { fadeInUp } from '@/design-system/animations'
import { getMaterials } from './api'
import { MaterialCard } from './components/MaterialCard'
import { MaterialFilters } from './components/MaterialFilters'
import type { FiltersState } from './components/MaterialFilters'

const EMPTY_FILTERS: FiltersState = { text: '', type: '', category: '' }

export const MaterialsPage: FC = () => {
  const navigate              = useNavigate()
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS)

  const { data: materials, isLoading, error } = useQuery({
    queryKey: ['student-materials'],
    queryFn: getMaterials,
  })

  const filtered = useMemo(() => {
    if (!materials) return []
    const q = filters.text.trim().toLowerCase()
    return materials.filter((m) => {
      if (q && !m.title.toLowerCase().includes(q)) return false
      if (filters.type && m.type !== filters.type) return false
      if (filters.category && m.category !== filters.category) return false
      return true
    })
  }, [materials, filters])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>
          Failed to load materials. Please try again.
        </p>
      </div>
    )
  }

  const hasAny = (materials?.length ?? 0) > 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} color="var(--accent)" />
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--fg)' }}>My Materials</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Videos, files, links, and study materials assigned by your teacher.
          </p>
        </motion.div>

        {hasAny && (
          <div className="mb-5">
            <MaterialFilters filters={filters} onChange={setFilters} />
          </div>
        )}

        {filtered.length === 0 && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center py-16">
            <BookOpen size={40} color="var(--muted)" className="mx-auto mb-3" />
            <p className="font-semibold" style={{ color: 'var(--fg)' }}>
              {!hasAny ? 'No materials assigned yet.' : 'No results match your filters.'}
            </p>
            {hasAny && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-sm underline mt-2"
                style={{ color: 'var(--accent)' }}
              >
                Clear filters
              </button>
            )}
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              onClick={() => navigate(`/student/materials/${m.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
