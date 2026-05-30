export type StepType = 'listening' | 'reading' | 'mcq' | 'writing' | 'speaking' | 'submit'

export interface MCQQuestion {
  id: number
  qOrder: number
  questionText: string
  optA: string | null
  optB: string | null
  optC: string | null
  optD: string | null
}

export interface WritingQuestion {
  id: number
  qOrder: number
  prompt: string
  minSentences: number | null
  focus: string | null
}

export interface SpeakingQuestion {
  id: number
  qOrder: number
  prompt: string
  timeLimitSeconds: number
  tips: string | null
}

export interface Homework {
  id: number
  title: string
  hwDate: string
  isSubmitted: boolean
  mediaUrl: string | null
  mediaInstructions: string | null
  readingText: string | null
  mcqQuestions: MCQQuestion[]
  writingQuestions: WritingQuestion[]
  speakingQuestions: SpeakingQuestion[]
  steps: StepType[]
  stepDurations: Partial<Record<StepType, number>>
}

export interface SubmitResult {
  mcqScore: number
  mcqTotal: number
}
