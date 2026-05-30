import { useState, useMemo } from 'react'
import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { stagger, cardVariant, fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { getOwnerStudents } from './api'
import type { OwnerStudent } from './types'

type StatusTab = 'active' | 'inactive'

export const StudentsPage: FC = () => {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [tab, setTab] = useState<StatusTab>('active')

  const { data: students = [], isLoading, isError } = useQuery({
    queryKey: ['owner-students'],
    queryFn: getOwnerStudents,
    staleTime: 120_000,
  })

  const levels = useMemo(() => {
    const set = new Set(students.map((s) => s.level).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [students])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (tab === 'active' ? !s.is_active : s.is_active) return false
      if (level !== 'all' && s.level !== level) return false
      if (q && !s.full_name.toLowerCase().includes(q) && !s.login_code.toLowerCase().includes(q)) return false
      return true
    })
  }, [students, tab, level, query])

  const activeCount = useMemo(() => students.filter((s) => s.is_active).length, [students])
  const inactiveCount = students.length - activeCount

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}><Spinner size="lg" /></div>
  }
  if (isError) {
    return <div className="flex h-screen items-center justify-center"><p className="text-sm" style={{ color: 'var(--danger)' }}>Failed to load students</p></div>
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Students</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{activeCount} active · {inactiveCount} inactive</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 grid place-items-center" style={{ insetInlineStart: '0.75rem', color: 'var(--muted)' }}>
            <Search size={15} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full rounded-xl py-2 text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', paddingInlineStart: '2.25rem', paddingInlineEnd: '0.75rem' }}
          />
        </div>

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-xl py-2 px-3 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        >
          {levels.map((l) => <option key={l} value={l}>{l === 'all' ? 'All levels' : l}</option>)}
        </select>

        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(['active', 'inactive'] as StatusTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="px-3 py-2 text-sm font-semibold capitalize"
              style={{ background: tab === t ? 'var(--accent)' : 'var(--surface)', color: tab === t ? '#fff' : 'var(--muted)', border: 'none', cursor: 'pointer' }}
            >
              {t} ({t === 'active' ? activeCount : inactiveCount})
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm py-16 text-center" style={{ color: 'var(--muted)' }}>
          {query ? `No students match "${query}"` : `No ${tab} students`}
        </p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s: OwnerStudent) => (
            <motion.div
              key={s.id}
              variants={cardVariant}
              whileHover={{ y: -2 }}
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold truncate" style={{ color: 'var(--fg)' }}>{s.full_name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{s.level}</span>
              </div>
              <code className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{s.login_code}</code>
              {s.balance && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {s.balance.remaining_sessions}/{s.balance.contract_sessions} sessions · {s.balance.package_name}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
