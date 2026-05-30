import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Mic, StopCircle, RotateCcw, CheckCircle } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import { useHomeworkStore } from '../homework.store'
import type { SpeakingQuestion } from '../types'

export interface SpeakingStepProps {
  questions: SpeakingQuestion[]
}

type RecStatus = 'idle' | 'recording' | 'done'

interface QState {
  status: RecStatus
  secondsLeft: number
  blobUrl: string | null
}

interface RecHandle {
  mr: MediaRecorder
  timer: ReturnType<typeof setInterval>
}

export const SpeakingStep: FC<SpeakingStepProps> = ({ questions }) => {
  const setSpeakingBlob = useHomeworkStore((s) => s.setSpeakingBlob)

  const [states, setStates] = useState<Record<number, QState>>(() =>
    Object.fromEntries(
      questions.map((q) => [q.id, { status: 'idle' as RecStatus, secondsLeft: q.timeLimitSeconds, blobUrl: null }]),
    ),
  )
  const handles = useRef<Record<number, RecHandle>>({})

  function patch(qid: number, update: Partial<QState>) {
    setStates((prev) => ({ ...prev, [qid]: { ...prev[qid], ...update } }))
  }

  async function toggleRecording(q: SpeakingQuestion) {
    const cur = states[q.id]

    if (cur.status === 'recording') {
      handles.current[q.id]?.mr.stop()
      return
    }

    if (cur.blobUrl) URL.revokeObjectURL(cur.blobUrl)
    patch(q.id, { status: 'recording', secondsLeft: q.timeLimitSeconds, blobUrl: null })

    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr       = new MediaRecorder(stream, { mimeType })
      const chunks: Blob[] = []

      mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }

      mr.onstop = () => {
        clearInterval(handles.current[q.id]?.timer)
        stream.getTracks().forEach((t) => t.stop())
        const blob   = new Blob(chunks, { type: mimeType })
        const blobUrl = URL.createObjectURL(blob)
        setSpeakingBlob(String(q.id), blob)
        patch(q.id, { status: 'done', blobUrl })
      }

      mr.start()

      let secs  = q.timeLimitSeconds
      const timer = setInterval(() => {
        secs--
        patch(q.id, { secondsLeft: secs })
        if (secs <= 0) {
          clearInterval(timer)
          if (mr.state === 'recording') mr.stop()
        }
      }, 1000)

      handles.current[q.id] = { mr, timer }
    } catch {
      patch(q.id, { status: 'idle', secondsLeft: q.timeLimitSeconds })
    }
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Mic size={20} color="var(--accent)" />
        <h2 className="font-bold text-base" style={{ color: 'var(--fg)' }}>قسم التحدث</h2>
      </div>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>سجّلي إجابتك لكل سؤال</p>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {questions.map((q, idx) => {
          const st = states[q.id]
          return (
            <motion.div
              key={q.id}
              variants={listItem}
              className="rounded-xl p-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--fg)' }}>
                {idx + 1}. {q.prompt}
              </p>
              {q.tips && (
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>💡 {q.tips}</p>
              )}
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                ⏱ {q.timeLimitSeconds} ثانية
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => { void toggleRecording(q) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: st.status === 'recording' ? 'var(--danger)' : 'var(--accent)',
                    color: 'var(--on-accent)',
                  }}
                >
                  {st.status === 'recording' ? (
                    <><StopCircle size={16} /> إيقاف</>
                  ) : st.status === 'done' ? (
                    <><RotateCcw size={16} /> إعادة تسجيل</>
                  ) : (
                    <><Mic size={16} /> تسجيل</>
                  )}
                </button>

                {st.status === 'recording' && (
                  <span className="text-sm font-mono" style={{ color: 'var(--danger)' }}>
                    ● {st.secondsLeft}ث
                  </span>
                )}
                {st.status === 'done' && <CheckCircle size={18} color="var(--success)" />}
              </div>

              {st.blobUrl && (
                <audio controls src={st.blobUrl} className="w-full mt-3 rounded-lg" />
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
