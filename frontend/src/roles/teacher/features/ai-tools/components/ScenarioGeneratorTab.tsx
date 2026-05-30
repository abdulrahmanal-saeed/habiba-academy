import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ExternalLink, Clock } from 'lucide-react'
import { aiToolsApi } from '../api'
import { isGovernanceError } from '../types'
import type { AIAnalysis, AIScenario } from '../types'

interface Props {
  studentId: number
  analysis?: AIAnalysis | null
}

const fieldCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-2)]'

export const ScenarioGeneratorTab: FC<Props> = ({ studentId, analysis }) => {
  const navigate = useNavigate()
  const [topic, setTopic]   = useState('')
  const [extra, setExtra]   = useState('')
  const [result, setResult] = useState<AIScenario | null>(null)

  const mutation = useMutation({
    mutationFn: () => aiToolsApi.generateScenario({ student_id: studentId, analysis, topic, extra_context: extra }),
    onSuccess: (data) => { if (!isGovernanceError(data)) setResult(data.scenario) },
  })

  const govError = mutation.data && isGovernanceError(mutation.data) ? mutation.data : null

  function useScenario() {
    if (result) navigate('/teacher/scenarios/create', { state: { ai_prefill: result } })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Topic / Context (optional)</label>
        <input className={fieldCls} type="text" placeholder="e.g. ordering food, at the airport, job interview…" value={topic} onChange={(e) => setTopic(e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Extra Notes (optional)</label>
        <input className={fieldCls} type="text" placeholder="Any specific requirements…" value={extra} onChange={(e) => setExtra(e.target.value)} />
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
        {mutation.isPending ? 'Generating…' : 'Generate Scenario'}
      </motion.button>

      {result && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{result.title}</p>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
              <Clock size={11} />
              {result.time_limit_seconds}s
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Situation</div>
            <p className="text-sm" style={{ color: 'var(--fg)' }}>{result.situation}</p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Prompt</div>
            <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{result.prompt}</p>
          </div>

          {result.keywords.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Keywords</div>
              <div className="flex flex-wrap gap-1">
                {result.keywords.map((kw, i) => (
                  <span key={i} className="rounded-lg px-2 py-0.5 text-xs" dir="rtl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            onClick={useScenario}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'pointer' }}
          >
            <ExternalLink size={13} />
            Use This Scenario
          </motion.button>
        </div>
      )}
    </div>
  )
}
