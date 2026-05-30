import { motion } from 'framer-motion'
import type { FC } from 'react'
import {
  BookOpen,
  CreditCard,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { stagger, fadeInUp } from '@/design-system/animations'
import type { HelpCategory } from '../types'

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard:  LayoutDashboard,
  homework:   BookOpen,
  payments:   CreditCard,
  students:   Users,
  teachers:   GraduationCap,
  messages:   MessageSquare,
  settings:   Settings,
  general:    HelpCircle,
}

export interface HelpCategoriesProps {
  categories: HelpCategory[]
  selected?: string
  onSelect: (slug: string | undefined) => void
}

export const HelpCategories: FC<HelpCategoriesProps> = ({
  categories,
  selected,
  onSelect,
}) => {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
    >
      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.icon] ?? HelpCircle
        const isActive = selected === cat.slug

        return (
          <motion.button
            key={cat.slug}
            variants={fadeInUp}
            type="button"
            onClick={() => onSelect(isActive ? undefined : cat.slug)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] p-4 text-center transition-colors"
            style={{
              background: isActive ? 'var(--accent-soft)' : 'var(--card)',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-soft)'}`,
              color: isActive ? 'var(--accent)' : 'var(--ink)',
            }}
          >
            <Icon size={20} style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }} />
            <span className="text-xs font-medium leading-tight">{cat.name}</span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {cat.articleCount} مقال
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
