import { useState, useRef, useCallback } from 'react'
import type { FC } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Play, Pause, RotateCcw } from 'lucide-react'

interface AudioRecorderProps {
  label: string
  isDone: boolean
  onRecorded: (blob: Blob) => void
}

type RecorderState = 'idle' | 'recording' | 'done'

export const AudioRecorder: FC<AudioRecorderProps> = ({ label, isDone, onRecorded }) => {
  const [status, setStatus] = useState<RecorderState>(isDone ? 'done' : 'idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const audioRef    = useRef<HTMLAudioElement | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        setAudioUrl(url)
        setStatus('done')
        onRecorded(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setStatus('recording')
    } catch {
      setError('تعذّر الوصول إلى الميكروفون. تأكد من منح الإذن.')
    }
  }, [onRecorded])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setStatus('idle')
    setIsPlaying(false)
    setError(null)
    chunksRef.current = []
  }, [audioUrl])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      void audioRef.current.play().then(() => setIsPlaying(true))
    }
  }, [isPlaying])

  return (
    <div
      className="rounded-[var(--radius-lg)] p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      <p className="mb-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>{label}</p>

      {error && <p className="mb-3 text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {status === 'idle' && (
          <motion.button
            type="button" whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            className="flex items-center gap-2 rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Mic size={15} /> ابدأ التسجيل
          </motion.button>
        )}

        {status === 'recording' && (
          <>
            <motion.button
              type="button" whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--danger)' }}
            >
              <Square size={15} /> إيقاف
            </motion.button>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--danger)' }}>
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--danger)' }} />
              جارٍ التسجيل…
            </span>
          </>
        )}

        {status === 'done' && (
          <>
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
              />
            )}
            <motion.button
              type="button" whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className="flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-sm"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            </motion.button>
            <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>✓ تم التسجيل</span>
            <motion.button
              type="button" whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="ms-auto flex items-center gap-1 text-xs"
              style={{ color: 'var(--muted)' }}
            >
              <RotateCcw size={12} /> إعادة
            </motion.button>
          </>
        )}
      </div>
    </div>
  )
}
