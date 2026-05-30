import { motion } from 'framer-motion'
import type { FC, ReactNode } from 'react'
import {
  Video, Headphones, FileText, Link, Image, BookOpen, Code2, File,
} from 'lucide-react'
import { cardVariant } from '@/design-system/animations'
import { MATERIAL_TYPES, MATERIAL_CATEGORIES, deriveProgressStatus } from '../utils'
import { ProgressBadge } from './ProgressBadge'
import type { MaterialListItem, MaterialType } from '../types'

export interface MaterialCardProps {
  material: MaterialListItem
  onClick: () => void
}

function typeIcon(type: MaterialType): ReactNode {
  switch (type) {
    case 'video':
    case 'video_link': return <Video size={16} color="var(--accent)" />
    case 'audio':      return <Headphones size={16} color="var(--accent)" />
    case 'pdf':
    case 'pptx':
    case 'document':   return <FileText size={16} color="var(--accent)" />
    case 'image':      return <Image size={16} color="var(--accent)" />
    case 'article':
    case 'mixed':      return <BookOpen size={16} color="var(--accent)" />
    case 'html':       return <Code2 size={16} color="var(--accent)" />
    case 'link':       return <Link size={16} color="var(--accent)" />
    default:           return <File size={16} color="var(--accent)" />
  }
}

export const MaterialCard: FC<MaterialCardProps> = ({ material, onClick }) => {
  const status    = deriveProgressStatus(material.viewed_at, material.completed_at)
  const typeLabel = MATERIAL_TYPES[material.type] ?? material.type
  const catLabel  = material.category ? (MATERIAL_CATEGORIES[material.category] ?? material.category) : null
  const desc      = material.description
    ? material.description.slice(0, 110) + (material.description.length > 110 ? '…' : '')
    : null

  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      className="rounded-xl p-4 cursor-pointer flex flex-col gap-2 h-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: 'var(--accent-soft)' }}>
            {typeIcon(material.type)}
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border-soft)' }}>
            {typeLabel}
          </span>
        </div>
        <ProgressBadge status={status} />
      </div>

      <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--fg)' }}>
        {material.title}
      </h3>

      {desc && (
        <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--muted)' }}>{desc}</p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {catLabel && (
          <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {catLabel}
          </span>
        )}
        {material.level && (
          <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border-soft)' }}>
            {material.level}
          </span>
        )}
        {material.estimated_study_minutes > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border-soft)' }}>
            {material.estimated_study_minutes} min
          </span>
        )}
      </div>
    </motion.div>
  )
}
