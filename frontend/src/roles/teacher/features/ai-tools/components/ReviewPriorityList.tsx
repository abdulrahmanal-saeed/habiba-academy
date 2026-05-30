import { type FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { aiToolsApi } from '../api'

interface Props {
  limit?: number
}

export const ReviewPriorityList: FC<Props> = ({ limit = 10 }) => {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['review-priority', limit],
    queryFn: () => aiToolsApi.getReviewPriority(limit),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const items = data ?? []

  if (!items.length) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No students flagged for priority review.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={14} style={{ color: 'var(--warning, #f59e0b)' }} />
        <span className="text-xs font-bold uppercase" style={{ color: 'var(--muted)' }}>Priority Review</span>
      </div>
      {items.map((item, i) => (
        <motion.button
          key={item.student_id}
          type="button"
          whileHover={{ y: -1 }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
          onClick={() => navigate(`/teacher/students/${item.student_id}`)}
          className="w-full text-start rounded-xl p-3 flex items-center justify-between"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{item.full_name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.reason}</p>
          </div>
          <span
            className="text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0"
            style={{
              background: item.priority_score >= 70 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              color: item.priority_score >= 70 ? 'var(--error)' : 'var(--warning, #f59e0b)',
            }}
          >
            {item.priority_score}
          </span>
        </motion.button>
      ))}
    </div>
  )
}
