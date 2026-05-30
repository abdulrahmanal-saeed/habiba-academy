import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger, listItem } from '@/design-system/animations'

interface StatChipProps {
  value: string
  label: string
}

const StatChip: FC<StatChipProps> = ({ value, label }) => (
  <motion.div
    variants={listItem}
    className="flex flex-col items-center gap-1 rounded-2xl px-4 py-3 flex-1 min-w-[80px]"
    style={{ background: 'var(--bg-alt)' }}
  >
    <span className="text-2xl font-black leading-none" style={{ color: 'var(--accent)' }}>
      {value}
    </span>
    <span
      className="text-[0.65rem] font-semibold uppercase tracking-wider text-center"
      style={{ color: 'var(--muted)' }}
    >
      {label}
    </span>
  </motion.div>
)

interface StatsRowProps {
  hwCount: number
  avgPct: number | null
  scCount: number
  streak: number
  sessCount: number
}

export const StatsRow: FC<StatsRowProps> = ({ hwCount, avgPct, scCount, streak, sessCount }) => (
  <motion.div
    variants={stagger}
    initial="hidden"
    animate="visible"
    className="flex flex-wrap gap-2"
  >
    <StatChip value={String(hwCount)} label="Homeworks" />
    <StatChip value={avgPct !== null ? `${avgPct}%` : '—'} label="Avg Score" />
    <StatChip value={String(scCount)} label="Scenarios" />
    <StatChip value={streak > 0 ? `🔥${streak}` : '0'} label="Day Streak" />
    {sessCount > 0 && <StatChip value={String(sessCount)} label="Sessions" />}
  </motion.div>
)
