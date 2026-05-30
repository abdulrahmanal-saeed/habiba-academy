import { useState, useCallback } from 'react'
import type { ParsedAnswers, AnswerRow } from '../types'

// ── State shape ───────────────────────────────────────────────────────────────

interface SpeakingEntry {
  audioUrl: string
  duration: number
}

// Helper: convert AnswerRow[] → Record<questionId, answer>
function rowsToMap(rows: AnswerRow[] | undefined): Record<string, string> {
  return (rows ?? []).reduce<Record<string, string>>((acc, row) => {
    acc[row.question_id] = row.answer
    return acc
  }, {})
}

// Lazy initializer — builds exercises map from all ParsedAnswers exercise keys
const EXERCISE_KEYS: ReadonlyArray<keyof ParsedAnswers> = [
  'mcq', 'number_recognition', 'listening_numbers', 'listening_review',
  'color_recognition', 'time_recognition', 'direction_recognition',
  'work_sentence_practice', 'pain_sentence_practice', 'topic_recognition',
  'topic_category', 'category_practice', 'price_recognition', 'reading_comprehension',
  'matching', 'description_matching', 'daily_action_matching', 'direction_matching',
  'job_matching', 'workplace_matching', 'body_matching', 'health_phrase_matching',
  'conversation_phrase_matching', 'vocabulary_matching',
  'sequence_practice', 'complete_sentence', 'complete_conversation', 'arrange_words',
]

function buildExercises(answers: ParsedAnswers): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  for (const key of EXERCISE_KEYS) {
    const rows = answers[key] as AnswerRow[] | undefined
    if (rows?.length) out[key as string] = rowsToMap(rows)
  }
  return out
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBookAnswers(initialAnswers: ParsedAnswers) {
  const [exercises, setExercises] = useState<Record<string, Record<string, string>>>(
    () => buildExercises(initialAnswers),
  )
  const [warmup, setWarmupState] = useState<Record<string, string>>(
    () => ({ ...(initialAnswers.warmup ?? {}) }),
  )
  const [writingTask, setWritingTaskState] = useState<string>(
    () => initialAnswers.writing_task?.answer ?? '',
  )
  const [writingTasks, setWritingTasksState] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        Object.entries(initialAnswers.writing_tasks ?? {}).map(([k, v]) => [k, v.answer]),
      ),
  )
  const [speakingAudioUrl, setSpeakingAudioUrlState] = useState<string>(
    () => initialAnswers.speaking_task?.audio_url ?? '',
  )
  const [speakingDuration, setSpeakingDurationState] = useState<number>(
    () => initialAnswers.speaking_task?.duration_seconds ?? 0,
  )
  const [speakingTasks, setSpeakingTasksState] = useState<Record<string, SpeakingEntry>>(
    () =>
      Object.fromEntries(
        Object.entries(initialAnswers.speaking_tasks ?? {}).map(([k, v]) => [
          k,
          { audioUrl: v.audio_url, duration: v.duration_seconds },
        ]),
      ),
  )
  const [selfCheck, setSelfCheckState] = useState<string[]>(
    () => [...(initialAnswers.self_check ?? [])],
  )

  // ── Setters ──────────────────────────────────────────────────────────────

  const setExercise = useCallback((type: string, questionId: string, value: string) => {
    setExercises((prev) => ({
      ...prev,
      [type]: { ...(prev[type] ?? {}), [questionId]: value },
    }))
  }, [])

  const setWarmup = useCallback((key: string, value: string) => {
    setWarmupState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setWritingTask = useCallback((value: string) => {
    setWritingTaskState(value)
  }, [])

  const setWritingTaskKey = useCallback((key: string, value: string) => {
    setWritingTasksState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setSpeakingAudioUrl = useCallback((url: string, duration: number) => {
    setSpeakingAudioUrlState(url)
    setSpeakingDurationState(duration)
  }, [])

  const setSpeakingTask = useCallback((key: string, url: string, duration: number) => {
    setSpeakingTasksState((prev) => ({
      ...prev,
      [key]: { audioUrl: url, duration },
    }))
  }, [])

  const toggleSelfCheck = useCallback((key: string) => {
    setSelfCheckState((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])

  // ── Build FormData for save-draft / submit ────────────────────────────────

  const getFormData = useCallback(
    (lessonId: number): FormData => {
      const fd = new FormData()
      fd.append('lesson_id', String(lessonId))

      // All indexed exercise types
      for (const [type, answers] of Object.entries(exercises)) {
        for (const [qId, value] of Object.entries(answers)) {
          fd.append(`${type}[${qId}]`, value)
        }
      }

      // Warmup
      for (const [key, value] of Object.entries(warmup)) {
        fd.append(`warmup[${key}]`, value)
      }

      // Writing (single)
      if (writingTask) fd.append('writing_task', writingTask)

      // Writing (keyed)
      for (const [key, value] of Object.entries(writingTasks)) {
        fd.append(`writing_tasks[${key}]`, value)
      }

      // Speaking (single)
      if (speakingAudioUrl) {
        fd.append('speaking_audio_url', speakingAudioUrl)
        fd.append('speaking_duration_seconds', String(speakingDuration))
      }

      // Speaking (keyed)
      for (const [key, { audioUrl, duration }] of Object.entries(speakingTasks)) {
        fd.append(`speaking_tasks[${key}][audio_url]`, audioUrl)
        fd.append(`speaking_tasks[${key}][duration_seconds]`, String(duration))
      }

      // Self-check (checkbox array)
      for (const key of selfCheck) {
        fd.append('self_check[]', key)
      }

      return fd
    },
    [exercises, warmup, writingTask, writingTasks, speakingAudioUrl, speakingDuration, speakingTasks, selfCheck],
  )

  return {
    // State (read)
    exercises,
    warmup,
    writingTask,
    writingTasks,
    speakingAudioUrl,
    speakingDuration,
    speakingTasks,
    selfCheck,
    // Actions
    setExercise,
    setWarmup,
    setWritingTask,
    setWritingTaskKey,
    setSpeakingAudioUrl,
    setSpeakingTask,
    toggleSelfCheck,
    getFormData,
  }
}

export type BookAnswers = ReturnType<typeof useBookAnswers>
