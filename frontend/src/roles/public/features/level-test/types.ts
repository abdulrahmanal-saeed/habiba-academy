export type LevelTestStep =
  | 'registration'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'result'

export interface RegistrationData {
  fullName: string
  email: string
  whatsapp: string
  age: string
  country: string
}

export interface BlockQuestion {
  id: number
  itemNumber: number
  questionAr: string
  optA: string
  optB: string
  optC: string
  optD?: string
}

export interface LevelTestBlock {
  blockNumber: number
  section: 'listening' | 'reading'
  audioPath?: string
  passageAr?: string
  cefrLevel: string
  questions: BlockQuestion[]
}

export interface SpeakingPrompt {
  number: 1 | 2 | 3 | 4
  title: string
  bullets: string[]
  imageUrl?: string
}

export interface LevelTestData {
  listeningBlocks: LevelTestBlock[]
  readingBlocks: LevelTestBlock[]
  writingTask1: string
  writingTask2: string
  speakingPrompts: SpeakingPrompt[]
}

export interface LevelTestResult {
  estimatedLevel: string
  score: number
}

export type SpeakingKey = `speaking_${1 | 2 | 3 | 4}`
export type McqAnswers = Record<number, string>
