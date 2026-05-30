import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { NewBriefForm } from './components/NewBriefForm'
import { pageVariant } from './animations'

export const NewBriefPage: FC = () => (
  <motion.div
    variants={pageVariant}
    initial="hidden"
    animate="visible"
    className="flex flex-col gap-5"
  >
    <Link to="/academy/briefs" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
      ← العودة
    </Link>

    <div>
      <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>بريف طالب جديد</h1>
      <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
        أرسل تفاصيل الطالب للمعلمة لمراجعته
      </p>
    </div>

    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <NewBriefForm />
    </div>
  </motion.div>
)
