export type MCQOption = 'a' | 'b' | 'c' | 'd'

/* Derived locally from chosenOption + correctOption — never from API */
export type MCQOptionState =
  | 'correct-chosen'    // chosen === correct  → green filled
  | 'correct-unchosen'  // correct but not chosen → light green
  | 'wrong-chosen'      // chosen but wrong → red filled
  | 'neutral'           // not chosen, not correct → transparent

export interface MCQResult {
  id: number
  qOrder: number
  questionText: string
  optA: string | null
  optB: string | null
  optC: string | null
  optD: string | null
  correctOption: MCQOption
  chosenOption: MCQOption | null   // null = not answered
  isCorrect: boolean
}

export interface WritingResult {
  id: number
  qOrder: number
  prompt: string
  answerText: string | null
}

export interface SpeakingResult {
  id: number
  qOrder: number
  prompt: string
  audioPath: string | null   // ensure leading '/' before use
}

export interface BookPopupConfig {
  allowed: boolean
  offerId: number
}

export interface HomeworkResult {
  id: number
  title: string
  hwDate: string
  isSubmitted: boolean
  submittedAt: string | null
  mcqScore: number
  mcqTotal: number
  teacherNote: string | null
  readingText: string | null
  mcqResults: MCQResult[]
  writingResults: WritingResult[]
  speakingResults: SpeakingResult[]
  bookPopup: BookPopupConfig | null
}
