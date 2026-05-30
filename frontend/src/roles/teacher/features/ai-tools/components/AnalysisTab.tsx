import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Brain, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { aiToolsApi } from '../api'
import { isGovernanceError } from '../types'
import type { AIAnalysis } from '../types'

interface Props {
  studentId: number
  onAnalysisDone?: (analysis: AIAnalysis) => void
}

const STATUS_CONFIG = {
  on_track:      { icon: CheckCircle,   color: 'var(--success)',         label: 'On Track' },
  needs_review:  { icon: AlertTriangle, color: 'var(--warning, #f59e0b)', label: 'Needs Review' },
  needs_support: { icon: AlertCircle,   color: 'var(--error)',            label: 'Needs Support' },
} as const

export const AnalysisTab: FC<Props> = ({ studentId, onAnalysisDone }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)

  const mutation = useMutation({
    mutationFn: () => aiToolsApi.analyzeStudent(studentId),
    onSuccess: (data) => {
      if (!isGovernanceError(data)) {
        setAnalysis(data.analysis)
        onAnalysisDone?.(data.analysis)
      }
    },
  })

  const govError = mutation.data && isGovernanceError(mutation.data) ? mutation.data : null
  const statusConf = analysis ? STATUS_CONFIG[analysis.status] : null
  const StatusIcon = statusConf?.icon

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-4">
      {!analysis && !mutation.isPending && (
        <div className="flex flex-col items-center gap-4 py-8 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Brain size={36} style={{ color: 'var(--accent)', opacity: 0.6 }} />
          <p className="text-sm text-center px-4" style={{ color: 'var(--muted)' }}>
            Run AI analysis to get personalised insights for this student.
          </p>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Sparkles size={14} />
            Run Analysis
          </motion.button>
        </div>
      )}

      {mutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Analysing student data…</p>
        </div>
      )}

      {govError && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>{govError.error.replace(/_/g, ' ')}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{govError.message}</p>
        </div>
      )}

      {mutation.isError && !govError && (
        <p className="text-sm" style={{ color: 'var(--error)' }}>Analysis failed. Please try again.</p>
      )}

      {analysis && !mutation.isPending && (
        <div className="space-y-3">
          {statusConf && StatusIcon && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <StatusIcon size={15} style={{ color: statusConf.color }} />
              <span className="text-sm font-semibold" style={{ color: statusConf.color }}>{statusConf.label}</span>
            </div>
          )}
          <InfoBlock label="Summary"                 text={analysis.summary} />
          <ListBlock label="Strengths"               items={analysis.strengths} accent="var(--success)" />
          <ListBlock label="Weak Areas"              items={analysis.weak_areas} accent="var(--error)" />
          <InfoBlock label="Recommended Focus"       text={analysis.recommended_focus} />
          <InfoBlock label="Homework Recommendation" text={analysis.homework_recommendation} />
          <InfoBlock label="Scenario Recommendation" text={analysis.scenario_recommendation} />
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            onClick={() => mutation.mutate()}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-sm font-semibold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer' }}
          >
            <RefreshCw size={13} />
            Re-analyse
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{text}</p>
    </div>
  )
}

function ListBlock({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  if (!items.length) return null
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)' }}>{label}</div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm flex items-start gap-1.5" style={{ color: 'var(--fg)' }}>
            <span style={{ color: accent, flexShrink: 0 }}>•</span>{item}
          </li>
        ))}
      </ul>
    </div>
  )
}
