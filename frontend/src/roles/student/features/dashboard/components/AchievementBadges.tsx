import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger, listItem } from '@/design-system/animations'
import type { Achievement } from '../types'

export interface AchievementBadgesProps {
  achievements: Achievement[]
}

export const AchievementBadges: FC<AchievementBadgesProps> = ({ achievements }) => {
  // Silent fail — no achievements = no section rendered
  if (achievements.length === 0) return null

  const visible = achievements.slice(0, 4)

  return (
    <section>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>
        الإنجازات
      </h3>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex gap-3 flex-wrap"
      >
        {visible.map((ach) => (
          <motion.div
            key={ach.id}
            variants={listItem}
            whileHover={{ y: -2, scale: 1.05 }}
            title={ach.description}
            className="flex flex-col items-center gap-1.5 cursor-default"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {ach.iconUrl ? (
                <img src={ach.iconUrl} alt={ach.title} className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-2xl">🏆</span>
              )}
            </div>
            <p className="text-xs text-center max-w-[56px] leading-tight" style={{ color: 'var(--muted)' }}>
              {ach.title}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
