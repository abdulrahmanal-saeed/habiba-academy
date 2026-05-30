import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Mic, Square, RefreshCw } from 'lucide-react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { ScenarioSection } from '../types'

export interface ScenarioSectionCardProps {
  section: ScenarioSection
  blobs: Record<string, Blob>
  missingIds: Set<string>
  onBlob: (qid: string, blob: Blob) => void
}

type RecState = 'idle' | 'recording' | 'done'

interface SState {
  status: RecState
  secondsLeft: number
  blobUrl: string | null
}

interface Recorder {
  mr: MediaRecorder
  timer: ReturnType<typeof setInterval>
}

export const ScenarioSectionCard: FC<ScenarioSectionCardProps> = ({ section, blobs, missingIds, onBlob }) => {
  const [states, setStates] = useState<Record<string, SState>>(() =>
    Object.fromEntries(
      section.scenarios.map((s) => [s.id, { status: 'idle', secondsLeft: s.time_limit_seconds, blobUrl: null }]),
    ),
  )
  const recorders = useRef<Record<string, Recorder>>({})

  function setSState(sid: string, patch: Partial<SState>) {
    setStates((prev) => ({ ...prev, [sid]: { ...prev[sid], ...patch } }))
  }

  async function handleRecord(sid: string, limitSecs: number) {
    if (recorders.current[sid]) {
      recorders.current[sid].mr.stop()
      return
    }
    try {
      const stream  = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr      = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []
      let secs = limitSecs

      mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }
      mr.onstop = () => {
        clearInterval(recorders.current[sid].timer)
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: mimeType })
        const url  = URL.createObjectURL(blob)
        onBlob(sid, blob)
        setSState(sid, { status: 'done', blobUrl: url })
        delete recorders.current[sid]
      }

      mr.start()
      setSState(sid, { status: 'recording', secondsLeft: limitSecs })

      const timer = setInterval(() => {
        secs -= 1
        setSState(sid, { secondsLeft: secs })
        if (secs <= 0 && mr.state === 'recording') mr.stop()
      }, 1000)

      recorders.current[sid] = { mr, timer }
    } catch {
      setSState(sid, { status: 'idle' })
    }
  }

  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'السيناريو الشفهي'}
      </h2>
      {section.instructions && (
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {section.instructions}
        </p>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {section.scenarios.map((scenario, i) => {
          const ss      = states[scenario.id] ?? { status: 'idle', secondsLeft: scenario.time_limit_seconds, blobUrl: null }
          const missing = missingIds.has(scenario.id) && !blobs[scenario.id]
          const isRec   = ss.status === 'recording'
          const isDone  = ss.status === 'done'

          return (
            <motion.div
              key={scenario.id}
              variants={cardVariant}
              className="rounded-[var(--radius-md)] p-4"
              style={{
                border: `1px solid ${missing ? 'var(--danger)' : 'var(--border)'}`,
                background: 'var(--bg)',
              }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                {i + 1}. {scenario.title}
              </p>
              {scenario.context && (
                <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                  {scenario.context}
                </p>
              )}
              {scenario.expected_steps && scenario.expected_steps.length > 0 && (
                <ul className="list-disc list-inside mb-3 flex flex-col gap-0.5">
                  {scenario.expected_steps.map((step, si) => (
                    <li key={si} className="text-xs" style={{ color: 'var(--muted)' }}>
                      {step.student_task}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                المدة: {scenario.time_limit_seconds} ثانية
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleRecord(scenario.id, scenario.time_limit_seconds)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors"
                  style={{ background: isRec ? 'var(--danger)' : 'var(--accent)', color: 'var(--bg)' }}
                >
                  {isRec ? <Square size={14} /> : isDone ? <RefreshCw size={14} /> : <Mic size={14} />}
                  {isRec ? `إيقاف (${ss.secondsLeft}ث)` : isDone ? 'إعادة التسجيل' : 'تسجيل'}
                </button>
                {isDone && (
                  <span className="text-xs" style={{ color: 'var(--success)' }}>
                    تم التسجيل
                  </span>
                )}
              </div>
              {ss.blobUrl && (
                <audio controls src={ss.blobUrl} className="mt-3 w-full" style={{ maxHeight: '40px' }} />
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
