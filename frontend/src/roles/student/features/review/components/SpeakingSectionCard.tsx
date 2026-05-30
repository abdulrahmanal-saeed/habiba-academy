import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Mic, Square, RefreshCw } from 'lucide-react'
import { cardVariant, stagger } from '@/design-system/animations'
import type { SpeakingSection } from '../types'

export interface SpeakingSectionCardProps {
  section: SpeakingSection
  blobs: Record<string, Blob>
  missingIds: Set<string>
  onBlob: (qid: string, blob: Blob) => void
}

type RecState = 'idle' | 'recording' | 'done'

interface QState {
  status: RecState
  secondsLeft: number
  blobUrl: string | null
}

interface Recorder {
  mr: MediaRecorder
  timer: ReturnType<typeof setInterval>
}

export const SpeakingSectionCard: FC<SpeakingSectionCardProps> = ({ section, blobs, missingIds, onBlob }) => {
  const [states, setStates] = useState<Record<string, QState>>(() =>
    Object.fromEntries(
      section.questions.map((q) => [q.id, { status: 'idle', secondsLeft: q.time_limit_seconds, blobUrl: null }]),
    ),
  )
  const recorders = useRef<Record<string, Recorder>>({})

  function setQState(qid: string, patch: Partial<QState>) {
    setStates((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch } }))
  }

  async function handleRecord(qid: string, limitSecs: number) {
    if (recorders.current[qid]) {
      recorders.current[qid].mr.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []
      let secs = limitSecs

      mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }
      mr.onstop = () => {
        clearInterval(recorders.current[qid].timer)
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: mimeType })
        const url  = URL.createObjectURL(blob)
        onBlob(qid, blob)
        setQState(qid, { status: 'done', blobUrl: url })
        delete recorders.current[qid]
      }

      mr.start()
      setQState(qid, { status: 'recording', secondsLeft: limitSecs })

      const timer = setInterval(() => {
        secs -= 1
        setQState(qid, { secondsLeft: secs })
        if (secs <= 0 && mr.state === 'recording') mr.stop()
      }, 1000)

      recorders.current[qid] = { mr, timer }
    } catch {
      setQState(qid, { status: 'idle' })
    }
  }

  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: 'var(--fg)' }}>
        {section.title ?? 'التعبير الشفهي'}
      </h2>
      {section.instructions && (
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {section.instructions}
        </p>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {section.questions.map((q, i) => {
          const qs      = states[q.id] ?? { status: 'idle', secondsLeft: q.time_limit_seconds, blobUrl: null }
          const missing = missingIds.has(q.id) && !blobs[q.id]
          const isRec   = qs.status === 'recording'
          const isDone  = qs.status === 'done'

          return (
            <motion.div
              key={q.id}
              variants={cardVariant}
              className="rounded-[var(--radius-md)] p-4"
              style={{
                border: `1px solid ${missing ? 'var(--danger)' : 'var(--border)'}`,
                background: 'var(--bg)',
              }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                {i + 1}. {q.prompt}
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                المدة: {q.time_limit_seconds} ثانية
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleRecord(q.id, q.time_limit_seconds)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors"
                  style={{
                    background: isRec ? 'var(--danger)' : 'var(--accent)',
                    color: 'var(--bg)',
                  }}
                >
                  {isRec ? <Square size={14} /> : isDone ? <RefreshCw size={14} /> : <Mic size={14} />}
                  {isRec ? `إيقاف (${qs.secondsLeft}ث)` : isDone ? 'إعادة التسجيل' : 'تسجيل'}
                </button>
                {isDone && (
                  <span className="text-xs" style={{ color: 'var(--success)' }}>
                    تم التسجيل
                  </span>
                )}
              </div>
              {qs.blobUrl && (
                <audio controls src={qs.blobUrl} className="mt-3 w-full" style={{ maxHeight: '40px' }} />
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
