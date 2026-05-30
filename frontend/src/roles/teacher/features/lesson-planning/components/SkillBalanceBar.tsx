import type { FC } from 'react'
import { motion } from 'framer-motion'
import { cardVariant } from '@/design-system/animations'
import type { SkillBalance } from '../types'

interface Props {
  skills: SkillBalance[]
}

export const SkillBalanceBar: FC<Props> = ({ skills }) => {
  if (skills.length === 0) return null

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3 className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Skill Coverage</h3>

      {skills.map(sk => (
        <div key={sk.skill} className="flex items-center gap-2">
          <span
            className="text-xs capitalize flex-shrink-0 truncate"
            style={{ color: 'var(--fg)', width: '6rem' }}
          >
            {sk.skill}
          </span>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${sk.pct}%`,
                background: 'var(--accent)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <span className="text-xs w-8 text-end flex-shrink-0" style={{ color: 'var(--muted)' }}>
            {sk.count}×
          </span>
        </div>
      ))}
    </motion.div>
  )
}
