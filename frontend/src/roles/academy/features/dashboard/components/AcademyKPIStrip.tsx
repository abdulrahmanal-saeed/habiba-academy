import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { AcademyKPIs } from '../types'
import { kpiStagger, kpiItem } from '../animations'

interface Props { kpis: AcademyKPIs }

interface KPICardProps { label: string; value: number; icon: string }

const KPICard: FC<KPICardProps> = ({ label, value, icon }) => (
  <motion.div
    variants={kpiItem}
    whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="flex items-center gap-3 rounded-xl px-5 py-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
    <div>
      <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  </motion.div>
)

export const AcademyKPIStrip: FC<Props> = ({ kpis }) => (
  <motion.div
    variants={kpiStagger}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-3 gap-4"
  >
    <KPICard label="الطلاب" value={kpis.student_count} icon="🎓" />
    <KPICard label="جلسات مكتملة" value={kpis.total_completed} icon="✅" />
    <KPICard label="جلسات قادمة" value={kpis.total_upcoming} icon="📅" />
  </motion.div>
)
