import { useState } from 'react'
import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Brain, Plus } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { getStudentDetail } from './api'
import { StatBar } from './components/StatBar'
import { OverviewTab } from './components/OverviewTab'
import { SubmissionsTab } from './components/SubmissionsTab'
import { WeakWordsTab } from './components/WeakWordsTab'
import { MistakesTab } from './components/MistakesTab'
import { StudentScenariosTab } from '../scenarios'
import { StudentMaterialsTab } from '../materials'
import { ScheduleTab } from './components/ScheduleTab'
import { StudentBookTab } from './components/StudentBookTab'
import { AIAnalysisModal } from '../ai-tools'
import { StudentReviewsTab } from '../reviews'
import type { StudentDetailTab } from './types'

const TABS: { key: StudentDetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'weak-words', label: 'Weak Words' },
  { key: 'mistakes', label: 'Mistakes' },
  { key: 'scenarios', label: 'Scenarios' },
  { key: 'materials', label: 'Materials' },
  { key: 'book', label: 'Book' },
  { key: 'schedule', label: 'Schedule' },
]

export const StudentDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const studentId = Number(id ?? 0)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<StudentDetailTab>('overview')
  const [showAI, setShowAI] = useState(false)

  const { data: student, isLoading, isError } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => getStudentDetail(studentId),
    enabled: studentId > 0,
  })

  if (!studentId) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-sm" style={{ color: 'var(--error)' }}>Invalid student ID</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (isError || !student) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--error)' }}>Failed to load student</p>
      </div>
    )
  }

  const initial = student.full_name.charAt(0).toUpperCase()

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-5 p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>

        <div
          className="flex items-center justify-center w-11 h-11 rounded-2xl text-base font-bold flex-shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: 'var(--fg)' }}>{student.full_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{student.login_code}</code>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: student.is_active ? 'var(--success-soft, rgba(16,185,129,0.1))' : 'var(--border)',
                color: student.is_active ? 'var(--success)' : 'var(--muted)',
              }}
            >
              {student.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
          >
            <Brain size={13} />
            AI
          </button>
          <button
            type="button"
            onClick={() => navigate(`/teacher/homework/create?student_id=${studentId}`)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={13} />
            Homework
          </button>
        </div>
      </div>

      {/* Balance */}
      {student.balance && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{student.balance.package_name}</span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {student.balance.remaining_sessions} / {student.balance.contract_sessions} remaining
          </span>
        </div>
      )}

      {/* Stats */}
      <StatBar student={student} />

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
            style={{
              background: activeTab === tab.key ? 'var(--accent)' : 'var(--surface)',
              color: activeTab === tab.key ? '#fff' : 'var(--muted)',
              border: `1px solid ${activeTab === tab.key ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={fadeInUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
          {activeTab === 'overview' && <OverviewTab studentId={studentId} />}
          {activeTab === 'submissions' && (
            <SubmissionsTab
              studentId={studentId}
              onEditHomework={(hwId) => navigate(`/teacher/homework/edit/${hwId}`)}
            />
          )}
          {activeTab === 'reviews' && <StudentReviewsTab studentId={studentId} />}
          {activeTab === 'weak-words' && <WeakWordsTab studentId={studentId} />}
          {activeTab === 'mistakes' && <MistakesTab studentId={studentId} />}
          {activeTab === 'scenarios' && <StudentScenariosTab studentId={studentId} />}
          {activeTab === 'materials' && <StudentMaterialsTab studentId={studentId} />}
          {activeTab === 'book' && <StudentBookTab studentId={studentId} />}
          {activeTab === 'schedule' && <ScheduleTab studentId={studentId} />}
        </motion.div>
      </AnimatePresence>

      {showAI && <AIAnalysisModal studentId={studentId} onClose={() => setShowAI(false)} />}
    </motion.div>
  )
}
