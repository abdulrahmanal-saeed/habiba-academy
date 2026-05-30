import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type {
  LevelTestData,
  LevelTestResult,
  RegistrationData,
  SpeakingKey,
} from './types'

type McqAnswers = Record<number, string>

export async function registerForTest(data: RegistrationData): Promise<void> {
  const form = new FormData()
  form.append('full_name', data.fullName)
  form.append('whatsapp', data.whatsapp)
  if (data.email)   form.append('email',   data.email)
  if (data.age)     form.append('age',     data.age)
  if (data.country) form.append('country', data.country)
  await postForm<ApiOk>('/api/leveltest/start', form)
}

export async function getLevelTestData(): Promise<LevelTestData> {
  const data = await get<ApiOk<LevelTestData>>('/api/leveltest/questions')
  return {
    listeningBlocks:  data.listeningBlocks,
    readingBlocks:    data.readingBlocks,
    writingTask1:     data.writingTask1,
    writingTask2:     data.writingTask2,
    speakingPrompts:  data.speakingPrompts,
  }
}

export async function submitLevelTest(payload: {
  listeningAnswers: McqAnswers
  readingAnswers:   McqAnswers
  writingTask1:     string
  writingTask2:     string
  recordings:       Partial<Record<SpeakingKey, Blob>>
}): Promise<LevelTestResult> {
  const form = new FormData()
  form.append('listening_answers', JSON.stringify(payload.listeningAnswers))
  form.append('reading_answers',   JSON.stringify(payload.readingAnswers))
  form.append('writing_task1',     payload.writingTask1)
  form.append('writing_task2',     payload.writingTask2)

  const keys: SpeakingKey[] = ['speaking_1', 'speaking_2', 'speaking_3', 'speaking_4']
  for (const key of keys) {
    const blob = payload.recordings[key]
    if (blob) form.append(key, blob, `${key}.webm`)
  }

  const data = await postForm<ApiOk<LevelTestResult>>('/api/leveltest/submit', form)
  return { estimatedLevel: data.estimatedLevel, score: data.score }
}
