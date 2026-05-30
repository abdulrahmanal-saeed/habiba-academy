import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant } from '@/design-system/animations'
import { SettingToggle } from './SettingToggle'
import type { FeatureFlags, FlagKey } from '../types'
import { FLAG_LABELS } from '../types'

interface ContentFlagsSectionProps {
  flags: FeatureFlags
  onToggle: (key: FlagKey, val: boolean) => void
  isUpdating: boolean
}

const FLAG_KEYS: FlagKey[] = [
  'enable_videos_page',
  'show_videos_on_homepage',
  'enable_articles_page',
  'show_articles_on_homepage',
]

export const ContentFlagsSection: FC<ContentFlagsSectionProps> = ({ flags, onToggle, isUpdating }) => (
  <motion.div
    variants={cardVariant}
    className="rounded-2xl p-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>Content Pages</h2>
    <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Control which content sections are visible to visitors.</p>
    {FLAG_KEYS.map((key) => (
      <SettingToggle
        key={key}
        label={FLAG_LABELS[key].label}
        desc={FLAG_LABELS[key].desc}
        enabled={flags[key]}
        onChange={(val) => onToggle(key, val)}
        disabled={isUpdating}
      />
    ))}
  </motion.div>
)
