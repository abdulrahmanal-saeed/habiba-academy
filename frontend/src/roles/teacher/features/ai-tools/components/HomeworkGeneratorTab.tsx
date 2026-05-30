import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ExternalLink } from 'lucide-react'
import { aiToolsApi } from '../api'
import { isGovernanceError } from '../types'
import type { AIAnalysis, AIHomework } from '../types'

interface Props {
  studentId: number
  analysis?: AIAnalysis | null
}

const SECTIONS = ['listening', 'reading', 'mcq', 'writing', 'speaking'] as const
type SectionKey = typeof SECTIONS[number]

const fieldCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-2)]'

export const HomeworkGeneratorTab: FC<Props> = ({ studentId, analysis }) => {
  const navigate = useNavigate()
  const [sections, setSections] = useState<SectionKey[]>(['writing', 'speaking'])
  const [lessonFocus, setLessonFocus] = useState('')
  const [result, setResult]           = useState<AIHomework | null>(null)

  const mutation = useMutation({
    mutationFn: () => aiToolsApi.generateHomework({ student_id: studentId, analysis, sections, lesson_focus: lessonFocus }),
    onSuccess: (data) => { if (!isGovernanceError(data)) setResult(data.homework) },
  })

  const govError = mutation.data && isGovernanceError(mutation.data) ? mutation.data : null

  function toggleSection(s: SectionKey) {
    setSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function useHomework() {
    if (result) navigate('/teacher/homework/create', { state: { ai_prefill: result } })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Sections to Include</label>
        <div className="flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSection(s)}
              className="rounded-lg px-3 py-1 text-xs font-medium capitalize"
              style={{
                background: sections.includes(s) ? 'var(--accent)' : 'var(--surface)',
                color: sections.includes(s) ? '#fff' : 'var(--muted)',
                border: `1px solid ${sections.includes(s) ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Lesson Focus (optional)</label>
        <input className={fieldCls} type="text" placeholder="e.g. daily routines, family vocabulary…" value={lessonFocus} onChange={(e) => setLessonFocus(e.target.value)} />
      </div>

      {govError && <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>{govError.error.replace(/_/g, ' ')} — {govError.message}</p>}
      {mutation.isError && !govError && <p className="text-sm" style={{ color: 'var(--error)' }}>Generation failed. Please try again.</p>}

      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        disabled={mutation.isPending || sections.length === 0}
        onClick={() => mutation.mutate()}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', opacity: (sections.length === 0 || mutation.isPending) ? 0.5 : 1 }}
      >
        <Sparkles size={14} />
        {mutation.isPending ? 'Generating…' : 'Generate Homework'}
      </motion.button>

      {result && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{result.title}</p>
          {SECTIONS.filter((s) => result[s]?.included).map((s) => (
            <div key={s}>
              <span className="text-xs font-bold uppercase" style={{ color: 'var(--muted)' }}>{s}</span>
              {s === 'reading' && result.reading.text && (
                <p className="text-sm mt-1" dir="rtl" style={{ color: 'var(--fg)' }}>{result.reading.text}</p>
              )}
              {s === 'listening' && result.listening.suggested_topic && (
                <p className="text-sm mt-1" style={{ color: 'var(--fg)' }}>Topic: {result.listening.suggested_topic}</p>
              )}
              {(s === 'mcq' || s === 'writing' || s === 'speaking') && result[s].questions && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{result[s].questions!.length} question(s)</p>
              )}
            </div>
          ))}
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            onClick={useHomework}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'pointer' }}
          >
            <ExternalLink size={13} />
            Use This Homework
          </motion.button>
        </div>
      )}
    </div>
  )
}
