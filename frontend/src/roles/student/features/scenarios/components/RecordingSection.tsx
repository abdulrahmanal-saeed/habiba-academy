import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { Mic, StopCircle, RotateCcw, Send } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { ConfidenceRatingWidget } from './ConfidenceRating'

export interface RecordingSectionProps {
  scenarioId: number
  timeLimitSeconds: number
  nextTake: number
  onSubmit: (audio: Blob, takeNo: number) => Promise<void>
  onSubmitted: () => void
}

type RecStatus = 'idle' | 'recording' | 'done' | 'submitting' | 'submitted'

export const RecordingSection: FC<RecordingSectionProps> = ({
  scenarioId,
  timeLimitSeconds,
  nextTake,
  onSubmit,
  onSubmitted,
}) => {
  const [status, setStatus]         = useState<RecStatus>('idle')
  const [secondsLeft, setSecondsLeft] = useState(timeLimitSeconds)
  const [blobUrl, setBlobUrl]       = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [submittedTake, setSubmittedTake] = useState<number | null>(null)

  const mrRef    = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const blobRef  = useRef<Blob | null>(null)

  async function startRecording(): Promise<void> {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    blobRef.current = null
    setError(null)
    setSecondsLeft(timeLimitSeconds)

    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr       = new MediaRecorder(stream, { mimeType })
      const chunks: Blob[] = []

      mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }
      mr.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: mimeType })
        blobRef.current = blob
        setBlobUrl(URL.createObjectURL(blob))
        setStatus('done')
      }

      mr.start()
      mrRef.current = mr
      setStatus('recording')

      let secs = timeLimitSeconds
      timerRef.current = setInterval(() => {
        secs--
        setSecondsLeft(secs)
        if (secs <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (mr.state === 'recording') mr.stop()
        }
      }, 1000)
    } catch {
      setError('Microphone access denied. Please allow mic access and try again.')
      setStatus('idle')
    }
  }

  function stopRecording(): void {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
  }

  async function handleSubmit(): Promise<void> {
    if (!blobRef.current) return
    setStatus('submitting')
    setError(null)
    try {
      await onSubmit(blobRef.current, nextTake)
      setSubmittedTake(nextTake)
      setStatus('submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
      setStatus('done')
    }
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-xl p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Mic size={18} color="var(--accent)" />
        <h2 className="font-bold text-base" style={{ color: 'var(--fg)' }}>Record Your Answer</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
        ⏱ Time limit: {timeLimitSeconds}s · Take #{nextTake}
      </p>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        {(status === 'idle' || status === 'done') && (
          <motion.button
            type="button"
            onClick={() => { void startRecording() }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {status === 'done' ? <RotateCcw size={15} /> : <Mic size={15} />}
            {status === 'done' ? 'Re-record' : 'Start Recording'}
          </motion.button>
        )}
        {status === 'recording' && (
          <motion.button
            type="button"
            onClick={stopRecording}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            <StopCircle size={15} /> Stop
          </motion.button>
        )}
        {status === 'recording' && (
          <span className="font-mono text-sm font-bold" style={{ color: 'var(--danger)' }}>
            ● {secondsLeft}s
          </span>
        )}
      </div>

      <AnimatePresence>
        {blobUrl && status !== 'submitted' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <audio controls src={blobUrl} className="w-full rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {status === 'done' && (
        <motion.button
          type="button"
          onClick={() => { void handleSubmit() }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <Send size={15} /> Submit Recording
        </motion.button>
      )}

      {status === 'submitting' && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Spinner size="sm" />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Submitting…</span>
        </div>
      )}

      {status === 'submitted' && submittedTake !== null && (
        <ConfidenceRatingWidget
          scenarioId={scenarioId}
          takeNo={submittedTake}
          onDone={onSubmitted}
        />
      )}
    </motion.div>
  )
}
