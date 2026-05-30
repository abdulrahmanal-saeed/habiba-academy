import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import { CEFR_META, CEFR_ORDER } from '../types'

interface CefrBarProps {
  currentLevel: string | null
}

const LEVEL_ORDER: Record<string, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
}

export const CefrBar: FC<CefrBarProps> = ({ currentLevel }) => {
  if (!currentLevel) return null

  const currentOrder = LEVEL_ORDER[currentLevel] ?? 0

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl px-5 py-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-0">
        {CEFR_ORDER.map((level, idx) => {
          const meta      = CEFR_META[level]
          const order     = LEVEL_ORDER[level] ?? 0
          const isDone    = order < currentOrder
          const isCurrent = level === currentLevel
          const isFirst   = idx === 0

          const circleBg     = isCurrent ? meta.bg     : isDone ? '#ede9fe' : 'var(--bg-alt)'
          const circleColor  = isCurrent ? meta.color  : isDone ? '#7c3aed' : 'var(--muted)'
          const circleBorder = isCurrent ? meta.color  : isDone ? '#7c3aed' : 'var(--border)'
          const labelColor   = isCurrent ? 'var(--fg)' : isDone ? 'var(--accent)' : 'var(--muted)'

          return (
            <div key={level} className="flex items-center flex-1">
              {!isFirst && (
                <div
                  className="h-0.5 flex-1"
                  style={{ background: isDone || isCurrent ? 'var(--accent)' : 'var(--border)' }}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: circleBg,
                    color: circleColor,
                    border: `2px solid ${circleBorder}`,
                    transform: isCurrent ? 'scale(1.18)' : undefined,
                  }}
                >
                  {isDone ? '✓' : level}
                </div>
                <span className="text-[0.65rem] font-semibold" style={{ color: labelColor }}>
                  {level}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
