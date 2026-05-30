import { useState } from 'react'
import type { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, RefreshCw, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { analyzeStudent } from '../api'
import type { AIAnalysis } from '../types'

interface AIAnalysisModalProps {
  studentId: number
  onClose: () => void
}

const STATUS_CONFIG = {
  on_track: { icon: CheckCircle, color: 'var(--success)', label: 'On Track' },
  needs_review: { icon: AlertTriangle, color: 'var(--warning, #f59e0b)', label: 'Needs Review' },
  needs_support: { icon: AlertCircle, color: 'var(--error)', label: 'Needs Support' },
} as const

export const AIAnalysisModal: FC<AIAnalysisModalProps> = ({ studentId, onClose }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeStudent(studentId)
      setAnalysis(res)
    } catch {
      setError('AI analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const statusConf = analysis ? STATUS_CONFIG[analysis.status] : null
  const StatusIcon = statusConf?.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      >
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Brain size={16} style={{ color: 'var(--accent)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--fg)' }}>AI Student Analysis</h2>
            </div>
            <button type="button" onClick={onClose} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {!analysis && !loading && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Brain size={40} style={{ color: 'var(--accent)', opacity: 0.5 }} />
                <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
                  Run an AI analysis to get insights about this student's progress, strengths, and recommendations.
                </p>
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold"
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Run Analysis
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Analysing student data…</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
                <button type="button" onClick={runAnalysis} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Retry
                </button>
              </div>
            )}

            {analysis && !loading && (
              <div className="flex flex-col gap-4">
                {statusConf && StatusIcon && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--bg)' }}>
                    <StatusIcon size={16} style={{ color: statusConf.color }} />
                    <span className="text-sm font-semibold" style={{ color: statusConf.color }}>{statusConf.label}</span>
                  </div>
                )}

                <Section label="Summary" content={analysis.summary} />
                <ListSection label="Strengths" items={analysis.strengths} />
                <ListSection label="Weak Areas" items={analysis.weak_areas} />
                <Section label="Recommended Focus" content={analysis.recommended_focus} />
                <Section label="Homework Recommendation" content={analysis.homework_recommendation} />
                <Section label="Scenario Recommendation" content={analysis.scenario_recommendation} />

                <button
                  type="button"
                  onClick={runAnalysis}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer' }}
                >
                  <RefreshCw size={13} />
                  Re-analyse
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{content}</p>
    </div>
  )
}

function ListSection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm flex items-start gap-1.5" style={{ color: 'var(--fg)' }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
