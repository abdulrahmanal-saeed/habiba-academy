import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { useCallback } from 'react'
import { fadeInUp, scaleIn } from '@/design-system/animations'
import { useMediaRecorder } from '../hooks/useMediaRecorder'

export interface SpeakingBlockProps {
  lessonId: number
  speakingKey?: string
  title: string
  instructions?: string
  maxDurationLabel?: string
  audioUrl: string
  onRecorded: (audioUrl: string, duration: number) => void
  readonly?: boolean
}

const pulseVariant = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1],
    transition: { repeat: Infinity, duration: 1.1, ease: 'easeInOut' as const },
  },
}

export const SpeakingBlock: FC<SpeakingBlockProps> = ({
  lessonId,
  speakingKey,
  title,
  instructions,
  maxDurationLabel,
  audioUrl,
  onRecorded,
  readonly = false,
}) => {
  const handleRecorded = useCallback(
    (url: string, duration: number) => {
      onRecorded(url, duration)
    },
    [onRecorded],
  )

  const { recordingState, errorMessage, startRecording, stopRecording } = useMediaRecorder(
    lessonId,
    speakingKey,
    handleRecorded,
  )

  const isRecording = recordingState === 'recording'
  const isUploading = recordingState === 'uploading'
  const isDisabled = readonly || isUploading

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem',
        marginBottom: '1rem',
      }}
    >
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
        {title}
      </h2>

      {instructions && (
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          {instructions}
        </p>
      )}

      {!readonly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '0.75rem',
          }}
        >
          <AnimatePresence mode="wait">
            {!isRecording ? (
              <motion.button
                key="start"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                type="button"
                disabled={isDisabled}
                onClick={() => void startRecording()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1,
                }}
              >
                <span>🎙</span>
                {isUploading ? 'جاري الرفع...' : audioUrl ? 'إعادة التسجيل' : 'بدء التسجيل'}
              </motion.button>
            ) : (
              <motion.button
                key="stop"
                type="button"
                onClick={stopRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <motion.span
                  animate={pulseVariant.animate}
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#fff',
                  }}
                />
                إيقاف التسجيل
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isRecording && (
              <motion.span
                key="rec-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: '0.8125rem', color: 'var(--danger)', fontWeight: 600 }}
              >
                يتم التسجيل الآن...
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      {errorMessage && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
          {errorMessage}
        </p>
      )}

      {audioUrl && (
        <audio
          controls
          src={audioUrl}
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
      )}

      {maxDurationLabel && !readonly && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-light)', marginTop: '0.5rem' }}>
          المدة القصوى: {maxDurationLabel}
        </p>
      )}
    </motion.section>
  )
}
