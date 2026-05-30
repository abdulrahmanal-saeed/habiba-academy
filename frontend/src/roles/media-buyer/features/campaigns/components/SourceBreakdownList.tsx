import { motion } from 'framer-motion'
import type { FC } from 'react'
import type { SourceBreakdown } from '../types'
import { rowStagger, rowItem } from '../animations'

interface Props { sources: SourceBreakdown[] }

export const SourceBreakdownList: FC<Props> = ({ sources }) => (
  <div
    className="rounded-2xl p-4 flex flex-col gap-3"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>مصادر الزيارات</h2>
    {sources.length === 0 ? (
      <p className="text-xs py-4 text-center" style={{ color: 'var(--muted)' }}>لا توجد زيارات بعد</p>
    ) : (
      <motion.ul
        variants={rowStagger}
        initial="hidden"
        animate="visible"
        className="list-none p-0 m-0 flex flex-col gap-2"
      >
        {sources.map((s) => (
          <motion.li
            key={s.source_label}
            variants={rowItem}
            className="flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}
          >
            <span className="text-sm" style={{ color: 'var(--ink)' }}>
              {s.source_label || 'غير محدد'}
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {s.total}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    )}
  </div>
)
