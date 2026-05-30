import { useState } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { slideUp } from '@/design-system/animations'
import type { LessonPlanSession, SessionSavePayload, SessionStatus } from '../types'
import { SessionStatusMenu } from './SessionStatusMenu'

interface Props {
  session: LessonPlanSession
  isSaving: boolean
  isStatusLoading: boolean
  onClose: () => void
  onSave: (payload: SessionSavePayload) => void
  onSetStatus: (id: number, status: SessionStatus, extra?: { actual_date?: string; planned_date?: string }) => void
}

export const SessionEditDrawer: FC<Props> = ({
  session, isSaving, isStatusLoading, onClose, onSave, onSetStatus,
}) => {
  const [title, setTitle]               = useState(() => session.title)
  const [plannedDate, setPlannedDate]   = useState(() => session.planned_date ?? '')
  const [sessionTime, setSessionTime]   = useState(() => session.session_time?.slice(0, 5) ?? '')
  const [skillsInput, setSkillsInput]   = useState(() => session.skills)
  const [goals, setGoals]               = useState(() => session.goals)
  const [teacherNotes, setTeacherNotes] = useState(() => session.teacher_notes)
  const [isMilestone, setIsMilestone]   = useState(() => session.is_milestone === 1)
  const [mLabel, setMLabel]             = useState(() => session.milestone_label)

  const inp = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    outline: 'none',
  }

  function handleSave() {
    onSave({
      id: session.id,
      student_id: session.student_id,
      title,
      planned_date: plannedDate || undefined,
      session_time: sessionTime || undefined,
      skills: skillsInput,
      goals,
      teacher_notes: teacherNotes,
      is_milestone: isMilestone ? 1 : 0,
      milestone_label: mLabel,
    })
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />

      {/* Drawer */}
      <motion.div
        variants={slideUp} initial="hidden" animate="visible" exit="hidden"
        onClick={e => e.stopPropagation()}
        className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl overflow-y-auto"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '90dvh',
        }}
      >
        <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto pb-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
              Session {session.session_number}
            </span>
            <div className="flex items-center gap-2">
              <SessionStatusMenu
                session={session}
                isLoading={isStatusLoading}
                onSetStatus={onSetStatus}
              />
              <button type="button" onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={`Session ${session.session_number}`}
              className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Date</label>
              <input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Time</label>
              <input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>
              Skills (comma-separated)
            </label>
            <input type="text" value={skillsInput} onChange={e => setSkillsInput(e.target.value)}
              placeholder="grammar, vocabulary, reading"
              className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
          </div>

          {/* Goals */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Goals</label>
            <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none" style={inp} />
          </div>

          {/* Teacher notes */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Teacher Notes</label>
            <textarea value={teacherNotes} onChange={e => setTeacherNotes(e.target.value)} rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none" style={inp} />
          </div>

          {/* Milestone */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id={`milestone-${session.id}`}
              checked={isMilestone} onChange={e => setIsMilestone(e.target.checked)} />
            <label htmlFor={`milestone-${session.id}`} className="text-sm" style={{ color: 'var(--fg)' }}>
              Mark as milestone
            </label>
          </div>
          {isMilestone && (
            <input type="text" value={mLabel} onChange={e => setMLabel(e.target.value)}
              placeholder="e.g. Mid-course review"
              className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
          )}

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Save size={14} />
            {isSaving ? 'Saving…' : 'Save Session'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
