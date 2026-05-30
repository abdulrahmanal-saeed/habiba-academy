import { useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { getActiveStudents, createHomework } from './api'
import { ListeningSection } from './components/ListeningSection'
import { ReadingSection } from './components/ReadingSection'
import { MCQSection } from './components/MCQSection'
import { WritingSection } from './components/WritingSection'
import { SpeakingSection } from './components/SpeakingSection'
import type { MCQQuestion, WritingQuestion, SpeakingQuestion } from './types'

interface SectionCardProps {
  sectionKey: string
  label: string
  children: ReactNode
  badge?: number
  expanded: boolean
  onToggle: (key: string) => void
}

const SectionCard: FC<SectionCardProps> = ({ sectionKey, label, children, badge, expanded, onToggle }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <button
      type="button"
      onClick={() => onToggle(sectionKey)}
      className="w-full flex items-center justify-between px-4 py-3"
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{label}</span>
        {badge !== undefined && badge > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {badge}
          </span>
        )}
      </div>
      {expanded ? (
        <ChevronUp size={15} style={{ color: 'var(--muted)' }} />
      ) : (
        <ChevronDown size={15} style={{ color: 'var(--muted)' }} />
      )}
    </button>
    {expanded && (
      <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="pt-3">{children}</div>
      </div>
    )}
  </div>
)

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const HomeworkCreatePage: FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedStudentId = Number(searchParams.get('student_id') ?? 0)

  const { data: students = [] } = useQuery({
    queryKey: ['active-students'],
    queryFn: getActiveStudents,
  })

  const [studentId, setStudentId] = useState(preselectedStudentId || 0)
  const [title, setTitle] = useState('')
  const [hwDate, setHwDate] = useState(today())
  const [publishTime, setPublishTime] = useState(nowTime())
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaInstructions, setMediaInstructions] = useState('')
  const [readingText, setReadingText] = useState('')
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([])
  const [writingQuestions, setWritingQuestions] = useState<WritingQuestion[]>([])
  const [speakingQuestions, setSpeakingQuestions] = useState<SpeakingQuestion[]>([])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    listening: false,
    reading: false,
    mcq: false,
    writing: false,
    speaking: false,
  })

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const mutation = useMutation({
    mutationFn: () =>
      createHomework({
        student_id: studentId,
        title,
        hw_date: hwDate,
        publish_time: status === 'published' ? publishTime : undefined,
        status,
        media_url: mediaUrl || undefined,
        media_instructions: mediaInstructions || undefined,
        reading_text: readingText || undefined,
        mcq_questions: mcqQuestions,
        writing_questions: writingQuestions,
        speaking_questions: speakingQuestions,
      }),
    onSuccess: (res) => {
      navigate(`/teacher/students/${studentId}?tab=submissions`, { replace: true })
      void res
    },
  })

  const canSubmit = studentId > 0 && title.trim().length > 0 && hwDate.length > 0 && !mutation.isPending

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
    outline: 'none',
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 p-4 max-w-2xl mx-auto"
    >
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
        <h1 className="text-base font-bold" style={{ color: 'var(--fg)' }}>New Homework</h1>
      </div>

      {/* Core fields */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Student *</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(Number(e.target.value))}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={inputStyle}
          >
            <option value={0}>Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Title *</label>
          <input
            type="text"
            placeholder="e.g. Week 3 Homework"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Date *</label>
            <input
              type="date"
              value={hwDate}
              onChange={(e) => setHwDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {status === 'published' && (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Publish time</label>
            <input
              type="time"
              value={publishTime}
              onChange={(e) => setPublishTime(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* Optional sections */}
      <SectionCard sectionKey="listening" label="Listening" badge={mediaUrl ? 1 : 0} expanded={expandedSections['listening'] ?? false} onToggle={toggleSection}>
        <ListeningSection
          mediaUrl={mediaUrl}
          mediaInstructions={mediaInstructions}
          onChange={(field, val) => {
            if (field === 'media_url') setMediaUrl(val)
            else setMediaInstructions(val)
          }}
        />
      </SectionCard>

      <SectionCard sectionKey="reading" label="Reading" badge={readingText ? 1 : 0} expanded={expandedSections['reading'] ?? false} onToggle={toggleSection}>
        <ReadingSection readingText={readingText} onChange={setReadingText} />
      </SectionCard>

      <SectionCard sectionKey="mcq" label="MCQ Questions" badge={mcqQuestions.length} expanded={expandedSections['mcq'] ?? false} onToggle={toggleSection}>
        <MCQSection questions={mcqQuestions} onChange={setMcqQuestions} />
      </SectionCard>

      <SectionCard sectionKey="writing" label="Writing Prompts" badge={writingQuestions.length} expanded={expandedSections['writing'] ?? false} onToggle={toggleSection}>
        <WritingSection questions={writingQuestions} onChange={setWritingQuestions} />
      </SectionCard>

      <SectionCard sectionKey="speaking" label="Speaking Prompts" badge={speakingQuestions.length} expanded={expandedSections['speaking'] ?? false} onToggle={toggleSection}>
        <SpeakingSection questions={speakingQuestions} onChange={setSpeakingQuestions} />
      </SectionCard>

      {/* Save */}
      {mutation.isError && (
        <p className="text-sm text-center" style={{ color: 'var(--error)' }}>
          Failed to save homework. Please try again.
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => mutation.mutate()}
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold"
        style={{
          background: canSubmit ? 'var(--accent)' : 'var(--border)',
          color: canSubmit ? '#fff' : 'var(--muted)',
          border: 'none',
          cursor: canSubmit ? 'pointer' : 'default',
        }}
      >
        <Save size={16} />
        {mutation.isPending ? 'Saving…' : status === 'published' ? 'Save & Publish' : 'Save as Draft'}
      </button>
    </motion.div>
  )
}
