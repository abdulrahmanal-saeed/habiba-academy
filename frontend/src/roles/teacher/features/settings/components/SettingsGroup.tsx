import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant } from '@/design-system/animations'
import type { SettingDefinition, SiteSettings } from '../types'
import { SettingToggle } from './SettingToggle'

interface SettingsGroupProps {
  title: string
  definitions: SettingDefinition[]
  settings: SiteSettings
  onUpdate: (key: string, value: string) => void
  isUpdating: boolean
}

export const SettingsGroup: FC<SettingsGroupProps> = ({
  title, definitions, settings, onUpdate, isUpdating,
}) => (
  <motion.div
    variants={cardVariant}
    className="rounded-2xl p-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--accent)' }}>{title}</h3>
    <div>
      {definitions.map((def) => (
        <SettingToggle
          key={def.key}
          definition={def}
          value={settings[def.key] ?? '0'}
          onChange={onUpdate}
          disabled={isUpdating}
        />
      ))}
    </div>
  </motion.div>
)
