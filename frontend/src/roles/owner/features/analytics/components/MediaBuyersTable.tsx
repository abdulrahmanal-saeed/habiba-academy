import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import type { MediaBuyerStat } from '../types'

interface MediaBuyersTableProps {
  data: MediaBuyerStat[]
}

export const MediaBuyersTable: FC<MediaBuyersTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-sm text-center py-10" style={{ color: 'var(--muted)' }}>
        No media buyer data yet.
      </div>
    )
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {['Name', 'Code', 'Visits', 'Conversions', 'Revenue'].map((h) => (
                <th key={h} className="text-start px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((mb, i) => (
              <tr key={mb.tracking_code} style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--fg)' }}>{mb.full_name}</td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>{mb.tracking_code}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--fg)' }}>{Number(mb.visits).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--fg)' }}>{Number(mb.conversions).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  AED {Number(mb.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
