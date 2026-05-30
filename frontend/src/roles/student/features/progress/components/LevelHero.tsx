import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import { CEFR_META } from '../types'

interface LevelHeroProps {
  level: string | null
  fullName: string
  sessCount: number
}

export const LevelHero: FC<LevelHeroProps> = ({ level, fullName, sessCount }) => {
  const meta = level ? CEFR_META[level] : null

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {meta && level ? (
        <>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-lg"
            style={{ background: meta.bg, color: meta.color, border: `3px solid ${meta.color}` }}
          >
            {level}
          </div>
          <div className="font-extrabold text-lg" style={{ color: 'var(--fg)' }}>
            {level} — {meta.desc_en}
          </div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            {fullName}
            {sessCount > 0 && <> · {sessCount} sessions completed</>}
          </div>
        </>
      ) : (
        <>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
            style={{
              background: 'var(--bg-alt)',
              color: 'var(--muted)',
              border: '3px solid var(--border)',
            }}
          >
            —
          </div>
          <div className="font-bold" style={{ color: 'var(--muted)' }}>
            Level not set yet
          </div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Complete the level test to get your CEFR level
          </div>
        </>
      )}
    </motion.div>
  )
}
