import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles, BookOpen } from 'lucide-react'
import { aiToolsApi } from '../api'
import { isGovernanceError } from '../types'
import type { AIAnalysis, AILesson } from '../types'

interface Props {
  studentId: number
  analysis?: AIAnalysis | null
}

const fieldCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-2)]'

export const LessonPlannerTab: FC<Props> = ({ studentId, analysis }) => {
  const [sessionNum, setSessionNum] = useState('')
  const [extra, setExtra]           = useState('')
  const [result, setResult]         = useState<AILesson | null>(null)

  const mutation = useMutation({
    mutationFn: () => aiToolsApi.prepareLesson({
      student_id: studentId,
      analysis,
      session_number: sessionNum ? Number(sessionNum) : undefined,
      extra_context: extra,
    }),
    onSuccess: (data) => { if (!isGovernanceError(data)) setResult(data.lesson) },
  })

  const govError = mutation.data && isGovernanceError(mutation.data) ? mutation.data : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Session Number (optional)</label>
          <input className={fieldCls} type="number" min="1" placeholder="e.g. 12" value={sessionNum} onChange={(e) => setSessionNum(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Extra Notes</label>
          <input className={fieldCls} type="text" placeholder="Focus area, topic…" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </div>
      </div>

      {govError && <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>{govError.error.replace(/_/g, ' ')} — {govError.message}</p>}
      {mutation.isError && !govError && <p className="text-sm" style={{ color: 'var(--error)' }}>Generation failed. Please try again.</p>}

      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', opacity: mutation.isPending ? 0.5 : 1 }}
      >
        <Sparkles size={14} />
        {mutation.isPending ? 'Generating…' : 'Prepare Lesson Plan'}
      </motion.button>

      {result && (
        <div className="space-y-3">
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color: 'var(--accent)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{result.lesson_title}</p>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{result.lesson_objective}</p>
            {result.level_note && <p className="text-xs italic" style={{ color: 'var(--muted)' }}>{result.level_note}</p>}
          </div>

          {result.vocabulary.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)' }}>Vocabulary ({result.vocabulary.length})</div>
              <div className="grid grid-cols-2 gap-2">
                {result.vocabulary.slice(0, 6).map((v, i) => (
                  <div key={i} className="rounded-lg p-2" style={{ background: 'var(--bg)' }}>
                    <p className="text-sm font-bold" dir="rtl" style={{ color: 'var(--fg)' }}>{v.arabic}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{v.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.warm_up && (
            <LessonSection label="Warm Up" mins={result.warm_up.duration_minutes} text={result.warm_up.activity ?? ''} />
          )}
          {result.main_speaking_task && (
            <LessonSection label="Main Speaking Task" mins={result.main_speaking_task.duration_minutes} text={result.main_speaking_task.description ?? result.main_speaking_task.student_instructions ?? ''} />
          )}
          {result.homework_suggestion && (
            <div className="rounded-2xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Homework Suggestion</div>
              <p className="text-sm" style={{ color: 'var(--fg)' }}>{result.homework_suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LessonSection({ label, mins, text }: { label: string; mins?: number; text: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase" style={{ color: 'var(--muted)' }}>{label}</span>
        {mins && <span className="text-xs" style={{ color: 'var(--muted)' }}>{mins} min</span>}
      </div>
      <p className="text-sm" style={{ color: 'var(--fg)' }}>{text}</p>
    </div>
  )
}
