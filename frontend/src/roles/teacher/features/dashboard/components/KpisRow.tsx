import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Users, FileText, MessageSquare, FlaskConical } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import type { TeacherKpis } from '../types'

interface KpisRowProps {
  kpis: TeacherKpis
}

interface KpiCardProps {
  label: string
  value: number
  sub: string
  icon: FC<{ size?: number }>
  accent?: boolean
}

const KpiCard: FC<KpiCardProps> = ({ label, value, sub, icon: Icon, accent }) => (
  <motion.div
    variants={cardVariant}
    className="rounded-2xl p-4 flex flex-col gap-2"
    style={{
      background: accent ? 'var(--accent-soft)' : 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(13,79,79,0.18)' : 'var(--border)'}`,
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: accent ? 'var(--accent)' : 'var(--bg)', color: accent ? '#fff' : 'var(--accent)' }}
      >
        <Icon size={15} />
      </div>
    </div>
    <div className="text-3xl font-black" style={{ color: accent ? 'var(--accent)' : 'var(--fg)' }}>
      {value}
    </div>
    <div className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</div>
  </motion.div>
)

export const KpisRow: FC<KpisRowProps> = ({ kpis }) => (
  <motion.div
    variants={stagger}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-2 gap-3 lg:grid-cols-4"
  >
    <KpiCard
      label="Active Students"
      value={kpis.students}
      sub={`${kpis.students_new} new this month`}
      icon={Users}
      accent
    />
    <KpiCard
      label="Homeworks"
      value={kpis.homeworks}
      sub={`${kpis.hw_pending} pending response`}
      icon={FileText}
    />
    <KpiCard
      label="Scenarios"
      value={kpis.scenarios}
      sub={`${kpis.sc_pending} awaiting recording`}
      icon={MessageSquare}
    />
    <KpiCard
      label="Level Tests"
      value={kpis.tests}
      sub="total attempts"
      icon={FlaskConical}
    />
  </motion.div>
)
