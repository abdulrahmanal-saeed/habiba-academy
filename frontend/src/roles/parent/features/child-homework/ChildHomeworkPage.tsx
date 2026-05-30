import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useChildHomework } from './hooks/useChildHomework'
import { HomeworkList } from './components/HomeworkList'
import { pageVariant } from './animations'

export const ChildHomeworkPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const childId = parseInt(id ?? '0', 10)
  const { data, isLoading, error } = useChildHomework(childId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          تعذّر تحميل الواجبات. يُرجى المحاولة مجدداً.
        </p>
      </div>
    )
  }

  const { child, homework } = data
  const submitted = homework.filter((h) => h.submitted === 1).length

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* Back */}
      <Link
        to="/parent"
        className="inline-flex items-center gap-1 text-sm"
        style={{ color: 'var(--accent)' }}
      >
        ← العودة
      </Link>

      {/* Child header */}
      <div
        className="flex items-start justify-between gap-3 rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
            {child.full_name}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {child.level}
          </p>
        </div>
        <div className="text-end">
          <span
            className="rounded-full px-2 py-0.5 font-mono text-xs"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {child.login_code}
          </span>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            {submitted} / {homework.length} مسلَّم
          </p>
        </div>
      </div>

      {/* Homework list */}
      <div
        className="rounded-2xl px-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <HomeworkList items={homework} />
      </div>
    </motion.div>
  )
}
