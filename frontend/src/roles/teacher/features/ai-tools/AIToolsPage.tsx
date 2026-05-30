import { useState, type FC } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { AIToolsPanel } from './components/AIToolsPanel'
import { ReviewPriorityList } from './components/ReviewPriorityList'

export const AIToolsPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramStudentId = searchParams.get('student_id')
  const [inputId, setInputId] = useState(paramStudentId ?? '')

  const studentId = inputId ? Number(inputId) : null
  const validId = studentId && studentId > 0 ? studentId : null

  function applyStudentId() {
    if (inputId) setSearchParams({ student_id: inputId })
    else setSearchParams({})
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-5 p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--accent-soft)' }}>
          <Brain size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>AI Tools</h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Generate content and insights powered by Claude AI</p>
        </div>
      </div>

      <div
        className="rounded-2xl p-4 flex gap-3 items-end"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--muted)' }}>Student ID (for student-specific tools)</label>
          <input
            type="number"
            min="1"
            placeholder="Enter student ID…"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyStudentId()}
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}
          />
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          onClick={applyStudentId}
          className="rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Load
        </motion.button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <AIToolsPanel studentId={validId} />
        <div className="flex flex-col gap-4">
          <ReviewPriorityList limit={8} />
        </div>
      </div>
    </motion.div>
  )
}
