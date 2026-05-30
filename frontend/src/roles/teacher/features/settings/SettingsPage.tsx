import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp, stagger } from '@/design-system/animations'
import { useSettings } from './hooks/useSettings'
import { SettingsGroup } from './components/SettingsGroup'
import { KNOWN_SETTINGS } from './types'

export const SettingsPage: FC = () => {
  const { settings, isLoading, updateSetting, isUpdating } = useSettings()

  const groups = ['Content']
  const groupedDefs = groups.reduce<Record<string, typeof KNOWN_SETTINGS>>((acc, g) => {
    acc[g] = KNOWN_SETTINGS.filter((d) => d.group === g)
    return acc
  }, {})

  const knownKeys = new Set(KNOWN_SETTINGS.map((d) => d.key))
  const extraEntries = Object.entries(settings).filter(([k]) => !knownKeys.has(k))

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5 p-4 max-w-2xl mx-auto"
    >
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Site Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Control which features are visible on the public site</p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {groups.map((group) => (
          <SettingsGroup
            key={group}
            title={group}
            definitions={groupedDefs[group]}
            settings={settings}
            onUpdate={updateSetting}
            isUpdating={isUpdating}
          />
        ))}

        {extraEntries.length > 0 && (
          <motion.div
            variants={stagger}
            className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--accent)' }}>Other Settings</h3>
            {extraEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <code className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{key}</code>
                <span className="text-xs font-medium" style={{ color: 'var(--fg)' }}>{value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
