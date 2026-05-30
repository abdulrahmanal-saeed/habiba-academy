import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, Video, Headphones, Link as LinkIcon, BookOpen } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { useChildMaterials } from './hooks/useChildMaterials'
import { pageVariant, stagger, cardVariant } from './animations'
import type { MaterialItem } from './types'

const TYPE_ICON: Record<string, React.ReactNode> = {
  video: <Video size={16} />,
  video_link: <Video size={16} />,
  audio: <Headphones size={16} />,
  pdf: <FileText size={16} />,
  document: <FileText size={16} />,
  article: <BookOpen size={16} />,
  link: <LinkIcon size={16} />,
}

function MaterialCard({ item }: { item: MaterialItem }) {
  const icon = TYPE_ICON[item.type] ?? <FileText size={16} />

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span
        className="mt-0.5 flex shrink-0 items-center justify-center rounded-xl p-2"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs line-clamp-2" style={{ color: 'var(--muted)' }}>{item.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs"
            style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {item.category.replace(/_/g, ' ')}
          </span>
          {item.viewed && (
            <span className="text-xs" style={{ color: 'var(--success)' }}>✓ شُوهد</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export const ChildMaterialsPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const childId = parseInt(id ?? '0', 10)
  const { data, isLoading, error } = useChildMaterials(childId)

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>تعذّر تحميل المواد.</p>
      </div>
    )
  }

  const { child, materials } = data
  const viewed = materials.filter((m) => m.viewed).length

  return (
    <motion.div variants={pageVariant} initial="hidden" animate="visible" className="flex flex-col gap-5">
      <Link to="/parent" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
        ← العودة
      </Link>

      <div
        className="flex items-start justify-between gap-3 rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{child.full_name}</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{child.level}</p>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{viewed} / {materials.length} شُوهد</p>
      </div>

      {materials.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>لا توجد مواد بعد.</p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
          {materials.map((m) => <MaterialCard key={m.id} item={m} />)}
        </motion.div>
      )}
    </motion.div>
  )
}
