import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Lock } from 'lucide-react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import type { Achievement } from '../types'

interface AchievementChipProps {
  achievement: Achievement
  locked?: boolean
}

const AchievementChip: FC<AchievementChipProps> = ({ achievement, locked = false }) => (
  <motion.span
    variants={listItem}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
    style={{
      background: 'var(--accent-soft)',
      color: 'var(--fg)',
      border: '1px solid var(--border-soft)',
      opacity: locked ? 0.35 : 1,
      filter: locked ? 'grayscale(1)' : undefined,
    }}
  >
    <span>{achievement.emoji}</span>
    <span>{achievement.title_en}</span>
  </motion.span>
)

interface AchievementGridProps {
  earned: Achievement[]
  all: Achievement[]
}

export const AchievementGrid: FC<AchievementGridProps> = ({ earned, all }) => {
  const earnedKeys = new Set(earned.map((a) => a.title_en))
  const locked = all.filter((a) => !earnedKeys.has(a.title_en))

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="font-bold mb-3" style={{ color: 'var(--fg)' }}>
          Achievements
        </div>
        {earned.length > 0 ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2"
          >
            {earned.map((a) => (
              <AchievementChip key={a.title_en} achievement={a} />
            ))}
          </motion.div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Complete your first homework to unlock achievements 🎯
          </p>
        )}
      </motion.div>

      {locked.length > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-1.5 font-bold mb-3" style={{ color: 'var(--muted)' }}>
            <Lock size={14} />
            <span>Coming Up</span>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2"
          >
            {locked.map((a) => (
              <AchievementChip key={a.title_en} achievement={a} locked />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
