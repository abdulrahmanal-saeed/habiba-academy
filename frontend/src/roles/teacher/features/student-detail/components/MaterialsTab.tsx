import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ExternalLink, FileText } from 'lucide-react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import { getMaterials } from '../api'

interface MaterialsTabProps {
  studentId: number
}

export const MaterialsTab: FC<MaterialsTabProps> = ({ studentId }) => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['student-materials', studentId],
    queryFn: () => getMaterials(studentId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.p
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="text-sm text-center py-10"
        style={{ color: 'var(--muted)' }}
      >
        No materials assigned yet
      </motion.p>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
      {items.map((item) => (
        <motion.div
          key={item.id}
          variants={listItem}
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <FileText size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{item.title}</div>
            {item.description && (
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{item.description}</div>
            )}
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.type}</div>
          </div>
          {item.href && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ color: 'var(--accent)', background: 'var(--accent-soft)', flexShrink: 0 }}
              aria-label="Open material"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
