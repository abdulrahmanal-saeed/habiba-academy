import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getLevelTestData, registerForTest, submitLevelTest } from '../api'
import { toast } from '@/design-system/components'
import type {
  LevelTestStep,
  RegistrationData,
  LevelTestResult,
  McqAnswers,
  SpeakingKey,
} from '../types'

export function useLevelTest() {
  const [step, setStep] = useState<LevelTestStep>('registration')
  const [listeningAnswers, setListeningAnswers] = useState<McqAnswers>({})
  const [readingAnswers, setReadingAnswers] = useState<McqAnswers>({})
  const [writingTask1, setWritingTask1] = useState('')
  const [writingTask2, setWritingTask2] = useState('')
  const [recordings, setRecordings] = useState<Partial<Record<SpeakingKey, Blob>>>({})
  const [result, setResult] = useState<LevelTestResult | null>(null)

  const { data: testData, isLoading: isLoadingTest } = useQuery({
    queryKey: ['leveltest', 'questions'],
    queryFn: getLevelTestData,
    enabled: step !== 'registration',
    staleTime: 30 * 60 * 1000,
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegistrationData) => registerForTest(data),
    onSuccess: () => setStep('listening'),
    onError: (e: Error) => toast.error(e.message),
  })

  const submitMutation = useMutation({
    mutationFn: submitLevelTest,
    onSuccess: (res) => { setResult(res); setStep('result') },
    onError: (e: Error) => toast.error(e.message),
  })

  const answerListening = useCallback((id: number, ans: string) => {
    setListeningAnswers((prev) => ({ ...prev, [id]: ans }))
  }, [])

  const answerReading = useCallback((id: number, ans: string) => {
    setReadingAnswers((prev) => ({ ...prev, [id]: ans }))
  }, [])

  const saveRecording = useCallback((key: SpeakingKey, blob: Blob) => {
    setRecordings((prev) => ({ ...prev, [key]: blob }))
  }, [])

  const handleSubmit = useCallback(() => {
    submitMutation.mutate({
      listeningAnswers,
      readingAnswers,
      writingTask1,
      writingTask2,
      recordings,
    })
  }, [submitMutation, listeningAnswers, readingAnswers, writingTask1, writingTask2, recordings])

  return {
    step, setStep,
    testData, isLoadingTest,
    listeningAnswers, readingAnswers,
    writingTask1, writingTask2, setWritingTask1, setWritingTask2,
    recordings, result,
    answerListening, answerReading, saveRecording,
    registerMutation,
    handleSubmit,
    isSubmitting: submitMutation.isPending,
  }
}
