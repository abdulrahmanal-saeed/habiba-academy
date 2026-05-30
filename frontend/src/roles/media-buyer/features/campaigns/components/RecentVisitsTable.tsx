import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { VisitRow } from '../types'
import { rowStagger, rowItem } from '../animations'

interface Props { visits: VisitRow[] }

const fmt = (d: string) =>
  new Date(d).toLocaleString('ar-AE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export const RecentVisitsTable: FC<Props> = ({ visits }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="px-4 py-3 font-bold text-sm" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>
      آخر الزيارات
    </div>
    {visits.length === 0 ? (
      <p className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>لا توجد زيارات بعد</p>
    ) : (
      <div className="overflow-x-auto">
        <motion.table
          variants={rowStagger}
          initial="hidden"
          animate="visible"
          className="w-full text-xs"
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
              <th className="px-3 py-2 text-start font-medium">الوقت</th>
              <th className="px-3 py-2 text-start font-medium">المصدر</th>
              <th className="px-3 py-2 text-start font-medium">الجهاز</th>
              <th className="px-3 py-2 text-start font-medium">الدولة</th>
              <th className="px-3 py-2 text-start font-medium">المدة</th>
              <th className="px-3 py-2 text-start font-medium">آخر صفحة</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v, i) => (
              <motion.tr
                key={i}
                variants={rowItem}
                style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink)' }}
              >
                <td className="px-3 py-2 whitespace-nowrap">{fmt(v.first_seen_at)}</td>
                <td className="px-3 py-2">{v.source_label || '—'}</td>
                <td className="px-3 py-2">{v.device_type || '—'}</td>
                <td className="px-3 py-2">{v.country || '—'}</td>
                <td className="px-3 py-2">{v.duration_seconds}ث</td>
                <td className="px-3 py-2 max-w-[120px] truncate">{v.last_path}</td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </div>
    )}
  </div>
)
