import { useState, useRef, useCallback } from 'react'
import { apiClient } from '@/core/lib/apiClient'
import type { RecordingState, SpeakingUploadResult } from '../types'

export type { RecordingState }

interface UseMediaRecorderReturn {
  recordingState: RecordingState
  errorMessage: string
  startRecording: () => Promise<void>
  stopRecording: () => void
}

const UPLOAD_URL = '/api/student/book-audio-upload.php'

export function useMediaRecorder(
  lessonId: number,
  speakingKey: string | undefined,
  onRecorded: (audioUrl: string, duration: number) => void,
): UseMediaRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const startRecording = useCallback(async () => {
    if (recordingState === 'recording') return
    setErrorMessage('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Browser recording is not supported. Please use Chrome or Firefox.')
      setRecordingState('error')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMessage('Microphone access failed. Please allow microphone access and try again.')
      setRecordingState('error')
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setRecordingState('uploading')

      try {
        const fd = new FormData()
        fd.append('lesson_id', String(lessonId))
        const filename = speakingKey
          ? `lesson-${lessonId}-${speakingKey}-recording.webm`
          : `lesson-${lessonId}-recording.webm`
        fd.append('audio', blob, filename)

        const result = await apiClient.postForm<SpeakingUploadResult>(UPLOAD_URL, fd)
        onRecorded(result.audio_url, result.duration_seconds)
        setRecordingState('done')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.'
        setErrorMessage(msg)
        setRecordingState('error')
      }
    }

    recorder.start()
    setRecordingState('recording')
  }, [lessonId, speakingKey, recordingState, onRecorded])

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  return { recordingState, errorMessage, startRecording, stopRecording }
}
